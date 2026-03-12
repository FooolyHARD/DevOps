const toxinTemplate = {
  name: "",
  description: "",
  organism_type: "jellyfish",
  neurotoxicity: 5,
  cytotoxicity: 5,
  pain_intensity: 5,
  systemic_factor: 5,
};

export function AdminPanel({ toxins, token, user, onCreate, onDelete, onChange, toxinForm }) {
  if (!token || !user?.is_admin) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Администрирование</p>
          <h2>Справочник токсинов</h2>
        </div>
      </div>

      <form
        className="grid-form"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate();
        }}
      >
        <label>
          Название
          <input name="name" value={toxinForm.name} onChange={onChange} required />
        </label>
        <label>
          Организм
          <select name="organism_type" value={toxinForm.organism_type} onChange={onChange}>
            <option value="jellyfish">Медуза</option>
            <option value="venomous_fish">Ядовитая рыба</option>
          </select>
        </label>
        <label className="full">
          Описание
          <textarea name="description" rows="2" value={toxinForm.description} onChange={onChange} />
        </label>
        <label>
          Нейротоксичность
          <input name="neurotoxicity" type="number" min="1" max="10" value={toxinForm.neurotoxicity} onChange={onChange} />
        </label>
        <label>
          Цитотоксичность
          <input name="cytotoxicity" type="number" min="1" max="10" value={toxinForm.cytotoxicity} onChange={onChange} />
        </label>
        <label>
          Интенсивность боли
          <input name="pain_intensity" type="number" min="1" max="10" value={toxinForm.pain_intensity} onChange={onChange} />
        </label>
        <label>
          Системный фактор
          <input name="systemic_factor" type="number" min="1" max="10" value={toxinForm.systemic_factor} onChange={onChange} />
        </label>
        <button className="primary-button full" type="submit">
          Добавить токсин
        </button>
      </form>

      <div className="list">
        {toxins.map((item) => (
          <article className="list-card" key={item.id}>
            <div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
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

export { toxinTemplate };
