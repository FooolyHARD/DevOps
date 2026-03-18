export function ScenarioList({ scenarios, onDelete }) {
  const riskImages = {
    low: "/risk-images/low.jpg",
    moderate: "/risk-images/moderate.jpg",
    high: "/risk-images/high.jpg",
    critical: "/risk-images/critical.jpg",
  };
  const organismLabels = {
    jellyfish: "Медуза",
    venomous_fish: "Ядовитая рыба",
  };
  const damageLabels = {
    local: "Локальное",
    deep_tissue: "Глубокие ткани",
    systemic: "Системное",
    anaphylactic: "Анафилактическое",
  };
  const bodyLabels = {
    head: "Голова",
    neck: "Шея",
    chest: "Грудь",
    arm: "Рука",
    hand: "Кисть",
    abdomen: "Живот",
    leg: "Нога",
    foot: "Стопа",
    back: "Спина",
  };

  const formatParams = (item) => {
    const parts = [
      item.toxin_type_name ? `Токсин: ${item.toxin_type_name}` : null,
      organismLabels[item.organism_type] || item.organism_type,
      `Категория: ${damageLabels[item.damage_category] || item.damage_category}`,
      `Зона: ${bodyLabels[item.body_location] || item.body_location}`,
      `Площадь: ${item.contact_area_cm2} см²`,
      `Длительность: ${item.contact_duration_min} мин`,
      `Возраст: ${item.victim_age}`,
      `Аллергия: ${item.has_allergy ? "да" : "нет"}`,
    ].filter(Boolean);
    return parts.join(" · ");
  };

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
              <p>{formatParams(item)}</p>
              <p className="muted">{item.recommendations}</p>
            </div>
            {riskImages[item.risk_level] ? (
              <img
                className="risk-image"
                src={riskImages[item.risk_level]}
                alt={`Иллюстрация риска: ${item.risk_level}`}
                loading="lazy"
              />
            ) : null}
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
