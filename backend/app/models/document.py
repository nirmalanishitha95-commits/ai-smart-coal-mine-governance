import datetime
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=True, index=True)
    doc_type = Column(String(50), nullable=False, index=True)
    # Inspection Report, Compliance Evidence, Violation Evidence, Corrective Action Evidence, Photograph, Regulatory Notice
    title = Column(String(200), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, default=0)
    mime_type = Column(String(100), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    related_entity = Column(String(50), nullable=True) # inspection, violation, corrective_action, compliance_record
    related_entity_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    mine = relationship("Mine")
