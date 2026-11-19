interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

function buildPageItems(page: number, pageCount: number): Array<number | "..."> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const items: Array<number | "..."> = [1];
  if (page > 3) items.push("...");

  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  for (let p = start; p <= end; p += 1) items.push(p);

  if (page < pageCount - 2) items.push("...");
  items.push(pageCount);

  return items;
}

export function Pagination({ page, pageCount, total, pageSize, onChange }: PaginationProps) {
  if (total === 0 || pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <span className="pagination-info">
        共 {total} 条 · 第 {from}-{to} 条
      </span>
      <div className="pagination-controls">
        <button className="page-button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          上一页
        </button>
        {buildPageItems(page, pageCount).map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={item}
              className={item === page ? "page-button active" : "page-button"}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          ),
        )}
        <button className="page-button" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
          下一页
        </button>
      </div>
    </div>
  );
}
