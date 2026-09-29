from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.models import User, Role
from backend.app.schemas.schemas import UserLogin, UserRegister, TokenResponse, UserResponse
from backend.app.services.auth_service import (
    verify_password, hash_password, create_access_token, get_current_user
)
from backend.app.services.audit_service import log_audit_action

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact system administrator.",
        )

    role_name = user.role.name if user.role else "USER"
    mine_name = user.mine.name if user.mine else None

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": role_name,
            "name": user.name
        }
    )

    log_audit_action(
        db=db,
        user=user,
        action="Login",
        entity="User",
        entity_id=user.id,
        details=f"User {user.email} logged in successfully."
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role_name,
            "mine_id": user.mine_id,
            "mine_name": mine_name,
            "designation": user.designation,
            "phone": user.phone
        }
    }

@router.post("/register", response_model=UserResponse)
def register(reg_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == reg_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered in system",
        )

    role = db.query(Role).filter(Role.name == reg_data.role_name).first()
    if not role:
        role = db.query(Role).filter(Role.name == "MINE_MANAGER").first()

    new_user = User(
        name=reg_data.name,
        email=reg_data.email,
        hashed_password=hash_password(reg_data.password),
        role_id=role.id,
        mine_id=reg_data.mine_id,
        designation=reg_data.designation,
        phone=reg_data.phone,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_action(
        db=db,
        user=new_user,
        action="Register",
        entity="User",
        entity_id=new_user.id,
        details=f"New user registered with role {role.name}."
    )

    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role_name": role.name,
        "mine_id": new_user.mine_id,
        "mine_name": new_user.mine.name if new_user.mine else None,
        "designation": new_user.designation,
        "phone": new_user.phone,
        "is_active": new_user.is_active
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.name if current_user.role else "USER",
        "mine_id": current_user.mine_id,
        "mine_name": current_user.mine.name if current_user.mine else None,
        "designation": current_user.designation,
        "phone": current_user.phone
    }
