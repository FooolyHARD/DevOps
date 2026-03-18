const initialForm = {
  title: "Новый сценарий",
  toxin_type_id: "",
  organism_type: "jellyfish",
  damage_category: "local",
  contact_area_cm2: 20,
  contact_duration_min: 10,
  victim_age: 30,
  has_allergy: false,
  body_location: "arm",
  notes: "",
};

export function getInitialScenarioForm() {
  return { ...initialForm };
}

export function ScenarioForm({
  form,
  toxins,
  organisms,
  damageCategories,
  bodyLocations,
  preview,
  error,
  onChange,
  onSubmit,
  onPreview,
}) {
  const availableToxins = toxins.filter((item) => item.organism_type === form.organism_type);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Сценарий</p>
          <h2>Расчет поражения</h2>
        </div>
        <button className="ghost-button" onClick={onPreview} type="button">
          Предварительный расчет
        </button>
      </div>

      <form className="grid-form" onSubmit={onSubmit}>
        <label className="full">
          Название сценария
          <input name="title" value={form.title} onChange={onChange} required />
        </label>
        <div className="full switcher">
          {organisms.map((item) => (
            <button
              key={item.value}
              className={form.organism_type === item.value ? "active" : ""}
              onClick={() => onChange({ target: { name: "organism_type", value: item.value, type: "button" } })}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <label>
          Тип токсина
          <select name="toxin_type_id" value={form.toxin_type_id} onChange={onChange} required>
            <option value="">Выберите токсин</option>
            {availableToxins.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Категория поражения
          <select name="damage_category" value={form.damage_category} onChange={onChange}>
            {damageCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Место поражения
          <select name="body_location" value={form.body_location} onChange={onChange}>
            {bodyLocations.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Площадь контакта, см²
          <input name="contact_area_cm2" type="number" min="1" value={form.contact_area_cm2} onChange={onChange} />
        </label>
        <label>
          Длительность контакта, мин
          <input
            name="contact_duration_min"
            type="number"
            min="1"
            value={form.contact_duration_min}
            onChange={onChange}
          />
        </label>
        <label>
          Возраст пострадавшего
          <input name="victim_age" type="number" min="1" value={form.victim_age} onChange={onChange} />
        </label>
        <label className="checkbox-label">
          <input name="has_allergy" type="checkbox" checked={form.has_allergy} onChange={onChange} />
          Наличие аллергии
        </label>
        <label className="full">
          Комментарий
          <textarea name="notes" rows="3" value={form.notes} onChange={onChange} />
        </label>
        <button className="primary-button full" type="submit">
          Сохранить сценарий
        </button>
        {error ? <div className="error-banner full">{error}</div> : null}
      </form>

      {preview ? (
        <div className={`risk-card risk-${preview.risk_level}`}>
          <p className="eyebrow">Результат</p>
          <h3>{preview.risk_score} баллов</h3>
          <p>{preview.summary}</p>
          <p>{preview.recommendations}</p>
        </div>
      ) : null}
    </section>
  );
}
