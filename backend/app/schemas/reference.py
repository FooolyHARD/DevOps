from pydantic import BaseModel


class EnumOption(BaseModel):
    value: str
    label: str
