import React, { FormEvent, useId, useMemo, useRef, useState } from 'react';
import {
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isBefore,
  endOfDay,
  isToday,
  subMonths,
  addMonths,
  isSameDay,
  parse,
} from 'date-fns';
import { formatDate } from '../utils/formatDate';
import { cc } from '../utils/cc';
import { EVENT_COLORS, useEvents } from '../context/useEvent';
import { Modal, ModalProps } from './Modal';
import { UnionOmit } from '../utils/types';
import { Event } from '../context/Events';

export function Calendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const firstWeekStart = startOfWeek(startOfMonth(selectedMonth));
    const lastWeekEnd = endOfWeek(endOfMonth(selectedMonth));
    return eachDayOfInterval({
      start: firstWeekStart,
      end: lastWeekEnd,
    });
  }, [selectedMonth]);

  const { events } = useEvents();

  return (
    <div className="calendar">
      <div className="header">
        <button className="btn" onClick={() => setSelectedMonth(new Date())}>
          Today
        </button>
        <div>
          <button
            className="month-change-btn"
            onClick={() =>
              setSelectedMonth(currentDate => subMonths(currentDate, 1))
            }
          >
            &lt;
          </button>
          <button
            className="month-change-btn"
            onClick={() => setSelectedMonth(current => addMonths(current, 1))}
          >
            &gt;
          </button>
        </div>
        <span className="month-title">
          {formatDate(selectedMonth, { month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="days">
        {calendarDays.map((day, index) => (
          <CalendarDay
            key={day.getTime()}
            day={day}
            selectedMonth={selectedMonth}
            showWeekName={index < 7}
            events={events.filter(event => isSameDay(event.date, day))}
          />
        ))}
      </div>
    </div>
  );
}

type CalendarDayProps = {
  day: Date;
  showWeekName: boolean;
  selectedMonth: Date;
  events: Event[];
};
function CalendarDay({
  day,
  showWeekName,
  selectedMonth,
  events,
}: CalendarDayProps) {
  const [isNewEventModalOpen, setIsNewEventModalOpen] =
    useState<boolean>(false);
  const { addEvent } = useEvents();

  const sortedEvents = useMemo(() => {
    const timeToNumber = (time: string) => parseFloat(time.replace(':', '.'));
    return [...events].sort((a, b) => {
      if (a.allDay && b.allDay) {
        return 0;
      } else if (a.allDay) {
        return -1;
      } else if (b.allDay) {
        return 1;
      } else {
        return timeToNumber(a.startTime) - timeToNumber(b.startTime);
      }
    });
  }, [events]);
  return (
    <div
      className={cc(
        'day',
        !isSameMonth(day, selectedMonth) && 'non-month-day',
        isBefore(endOfDay(day), new Date()) && 'old-month-day'
      )}
    >
      <div className="day-header">
        {showWeekName && (
          <div className="week-name">
            {formatDate(day, { weekday: 'short' })}
          </div>
        )}
        <div className={cc('day-number', isToday(day) && 'today')}>
          {formatDate(day, { day: 'numeric' })}
        </div>
        <button
          className="add-event-btn"
          onClick={() => setIsNewEventModalOpen(true)}
        >
          +
        </button>
      </div>
      {sortedEvents.length > 0 && (
        <div className="events">
          {sortedEvents.map(event => (
            <CalendarEvent event={event} key={event.id} />
          ))}
        </div>
      )}
      <EventFormModal
        isOpen={isNewEventModalOpen}
        date={day}
        onClose={() => setIsNewEventModalOpen(false)}
        onSubmit={addEvent}
      />
    </div>
  );
}
type CalendarEventProps = {
  event: Event;
};

function CalendarEvent({ event }: CalendarEventProps) {
  const [isEditModelOpen, setIsEditModelOpen] = useState<boolean>(false);
  const { deleteEvent, updateEvent } = useEvents();
  return (
    <>
      <button
        onClick={() => setIsEditModelOpen(true)}
        className={cc(
          'event',
          event.allDay && 'all-day-event',
          event.allDay && `${event.color}`
        )}
      >
        {event.allDay ? (
          <div className="event-name">{event.name}</div>
        ) : (
          <>
            <div className={`color-dot ${event.color}`}></div>
            <div className="event-time">
              {formatDate(parse(event.startTime, 'HH:mm', event.date), {
                timeStyle: 'short',
              })}
            </div>
            <div className="event-name">{event.name}</div>
          </>
        )}
      </button>
      <EventFormModal
        isOpen={isEditModelOpen}
        event={event}
        onDelete={() => deleteEvent(event.id)}
        onClose={() => setIsEditModelOpen(false)}
        onSubmit={e => updateEvent(e, event.id)}
      />
    </>
  );
}

type EventFormModalProps = {
  onSubmit: (event: UnionOmit<Event, 'id'>) => void;
} & (
  | { onDelete: (eventId: string) => void; event: Event; date?: never }
  | { onDelete?: never; event?: never; date: Date }
) &
  Omit<ModalProps, 'children'>;
function EventFormModal({
  onSubmit,
  onDelete,
  event,
  date,
  ...modalProps
}: EventFormModalProps) {
  const isNew = event == null;
  const formId = useId();

  const [selectedColor, setSelectedColor] = useState<
    (typeof EVENT_COLORS)[number]
  >(event?.color || EVENT_COLORS[0]);
  const [isAllDayChecked, setIsAllDayChecked] = useState<boolean>(
    event?.allDay || false
  );
  const [startTime, setStartTime] = useState(event?.startTime || '');

  const nameRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value;
    const endTime = endTimeRef.current?.value;

    if (name == null || name === '') {
      return;
    }

    const commonProps = {
      name,
      date: date || event.date,
      color: selectedColor,
    };

    let newEvent: UnionOmit<Event, 'id'>;

    if (isAllDayChecked) {
      newEvent = {
        ...commonProps,
        allDay: true,
      };
    } else {
      if (
        startTime == null ||
        startTime === '' ||
        endTime == null ||
        endTime === ''
      ) {
        return;
      }
      newEvent = {
        ...commonProps,
        allDay: false,
        startTime: startTime,
        endTime: endTime,
      };
    }
    modalProps.onClose();
    onSubmit(newEvent);
  }

  return (
    <Modal {...modalProps}>
      <div className="modal-title">
        <div>{isNew ? 'Add' : 'Edit'} Event</div>
        <small>{formatDate(date || event.date, { dateStyle: 'short' })}</small>
        <button className="close-btn" onClick={modalProps.onClose}>
          &times;
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor={`${formId}-name`}>Name</label>
          <input
            required
            defaultValue={event?.name}
            type="text"
            id={`${formId}-name`}
            ref={nameRef}
          />
        </div>
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id={`${formId}-all-day`}
            checked={isAllDayChecked}
            onChange={e => setIsAllDayChecked(e.target.checked)}
          />
          <label htmlFor={`${formId}-all-day`}>All Day?</label>
        </div>
        <div className="row">
          <div className="form-group">
            <label htmlFor={`${formId}-start-time`}>Start Time</label>
            <input
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              type="time"
              id={`${formId}-start-time`}
              disabled={isAllDayChecked}
              required={!isAllDayChecked}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`${formId}-end-time`}>End Time</label>
            <input
              ref={endTimeRef}
              defaultValue={event?.endTime}
              min={startTime}
              type="time"
              id={`${formId}-end-time`}
              disabled={isAllDayChecked}
              required={!isAllDayChecked}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="row left">
            {EVENT_COLORS.map(color => (
              <React.Fragment key={color}>
                <input
                  type="radio"
                  name="color"
                  value={color}
                  id={`${formId}-${color}`}
                  checked={selectedColor === color}
                  onChange={() => setSelectedColor(color)}
                  className="color-radio"
                />
                <label htmlFor={`${formId}-${color}`}>
                  <span className="sr-only">{color}</span>
                </label>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="row">
          <button className="btn btn-success" type="submit">
            {isNew ? 'Add' : 'Edit'}
          </button>
          {onDelete != null && (
            <button
              className="btn btn-delete"
              type="button"
              onClick={() => onDelete(event.id)}
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
