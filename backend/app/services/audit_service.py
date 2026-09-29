from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.models import AuditLog, User

def log_audit_action(
    db: Session,
    user: Optional[User],
    action: str,
    entity: str,
    entity_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: str = "127.0.0.1"
):
    try:
        user_id = user.id if user else None
        user_email = user.email if user else "system@coalguard.gov.in"
        audit_entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            entity=entity,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Logging failure should not break primary operation
        print(f"Audit log write warning: {e}")
