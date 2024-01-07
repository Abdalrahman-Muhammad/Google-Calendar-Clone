import {
  useState,
  type Key,
  type ReactNode,
  useRef,
  useLayoutEffect,
} from 'react';

type OverflowContainerProps<T> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  renderOverflow: (overflowAmount: number) => ReactNode;
  className?: string;
  getKey: (item: T) => Key;
};

export function OverflowContainer<T>({
  items,
  renderItem,
  renderOverflow,
  className,
  getKey,
}: OverflowContainerProps<T>) {
  const [overflowAmount, setOverflowAmount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current == null) return;

    const observer = new ResizeObserver(entries => {
      const containerElement = entries[0]?.target;
      if (containerElement == null) return;

      const childrens =
        containerElement.querySelectorAll<HTMLElement>('[data-item]');
      const overflowElement =
        containerElement.parentElement?.querySelector<HTMLElement>(
          '[data-overflow]'
        );

      if (overflowElement != null) {
        overflowElement.style.display = 'none';
      }

      childrens.forEach(child => child.style.removeProperty('display'));
      let amount = 0;
      for (let i = childrens.length - 1; i > 0; i--) {
        const child = childrens[i];
        if (containerElement.scrollHeight <= containerElement.clientHeight) {
          break;
        }
        amount = childrens.length - i;
        child.style.display = 'none';

        overflowElement?.style.removeProperty('display');
      }
      setOverflowAmount(amount);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div className={className} ref={containerRef}>
        {items.map(item => (
          <div data-item key={getKey(item)}>
            {renderItem(item)}
          </div>
        ))}
      </div>
      <div data-overflow>{renderOverflow(overflowAmount)}</div>
    </>
  );
}
