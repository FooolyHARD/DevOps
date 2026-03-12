from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.scenario import OrganismType, ToxinType
from app.models.user import User


def bootstrap_data(db: Session) -> None:
    settings = get_settings()

    admin = db.scalar(select(User).where(User.username == settings.bootstrap_admin_username))
    if not admin:
        db.add(
            User(
                username=settings.bootstrap_admin_username,
                email=settings.bootstrap_admin_email,
                password_hash=get_password_hash(settings.bootstrap_admin_password),
                is_admin=True,
            )
        )

    toxins = db.scalars(select(ToxinType)).all()
    if not toxins:
        db.add_all(
            [
                ToxinType(
                    name="Нейротоксин медузы",
                    description="Вызывает выраженный болевой синдром и умеренные системные реакции.",
                    organism_type=OrganismType.JELLYFISH,
                    neurotoxicity=8,
                    cytotoxicity=5,
                    pain_intensity=9,
                    systemic_factor=6,
                ),
                ToxinType(
                    name="Цитотоксин медузы",
                    description="Акцент на локальном поражении тканей и воспалении.",
                    organism_type=OrganismType.JELLYFISH,
                    neurotoxicity=4,
                    cytotoxicity=9,
                    pain_intensity=7,
                    systemic_factor=5,
                ),
                ToxinType(
                    name="Комбинированный яд рыбы",
                    description="Сильная боль, выраженный отек, риск глубинного поражения тканей.",
                    organism_type=OrganismType.VENOMOUS_FISH,
                    neurotoxicity=7,
                    cytotoxicity=8,
                    pain_intensity=10,
                    systemic_factor=7,
                ),
            ]
        )
    db.commit()
