export function ScenarioList({ scenarios, onDelete }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">История</p>
          <h2>Сохраненные сценарии</h2>
        </div>
      </div>
      <div className="list">
        {scenarios.length === 0 ? <p className="muted">Пока нет сохраненных сценариев.</p> : null}
        {scenarios.map((item) => (
          <article key={item.id} className="list-card">
            <div>
              <h3>{item.title}</h3>
              <p>{item.risk_summary}</p>
            </div>
            <div className="list-meta">
              <span className={`badge badge-${item.risk_level}`}>{item.risk_level}</span>
              <strong>{item.risk_score}</strong>
            </div>
            <button className="ghost-button" onClick={() => onDelete(item.id)} type="button">
              Удалить
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
