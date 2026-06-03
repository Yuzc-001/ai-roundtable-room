/** 审议收束区：结论与导出，版式与发言记录区分开 */
export function SessionClosure({ children }) {
  return (
    <section className="delib-closure" aria-label="审议收束与成果">
      <header className="delib-closure-head">
        <h2>审议收束</h2>
        <p>发言记录已完整。下面是结论、待办与可带走的档案。</p>
      </header>
      <div className="delib-closure-body">{children}</div>
    </section>
  );
}