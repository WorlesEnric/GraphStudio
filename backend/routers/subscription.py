from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database
from routers.auth import get_current_user

router = APIRouter(
    prefix="/subscription",
    tags=["subscription"]
)

@router.get("/", response_model=schemas.Subscription)
def get_subscription(current_user: models.User = Depends(get_current_user)):
    if not current_user.subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return current_user.subscription

@router.post("/upgrade")
def upgrade_subscription(plan: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # In a real app, this would integrate with Stripe/LemonSqueezy
    if plan not in ["pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    sub = current_user.subscription
    sub.plan_name = plan
    db.commit()
    return {"message": f"Upgraded to {plan}"}
