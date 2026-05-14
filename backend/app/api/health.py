from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def healthcheck():
    return {"status": "ok"}


@router.get("/load/cpu")
def cpu_load(work: int = 250000):
    total = 0
    for value in range(max(1, min(work, 5000000))):
        total += (value * value) % 97
    return {"status": "ok", "work": work, "checksum": total}
