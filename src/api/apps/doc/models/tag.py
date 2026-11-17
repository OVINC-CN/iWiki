from django.db import models
from django.utils.translation import gettext_lazy
from ovinc_client.core.constants import SHORT_CHAR_LENGTH
from ovinc_client.core.models import BaseModel, ForeignKey, UniqIDField


class Tag(BaseModel):
    """
    Tag
    """

    id = UniqIDField(gettext_lazy("ID"), primary_key=True)
    name = models.CharField(gettext_lazy("Name"), unique=True, max_length=SHORT_CHAR_LENGTH)
    created_at = models.DateTimeField(gettext_lazy("Created Time"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = gettext_lazy("Tag")
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return str(self.name)


class DocTag(BaseModel):
    """
    Doc Tag Relationship
    """

    id = UniqIDField(gettext_lazy("ID"), primary_key=True)
    doc = ForeignKey(gettext_lazy("Doc"), to="doc.Doc", on_delete=models.CASCADE)
    tag = ForeignKey(gettext_lazy("Tag"), to="doc.Tag", on_delete=models.CASCADE)
    created_at = models.DateTimeField(gettext_lazy("Created Time"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = gettext_lazy("Doc Tag")
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]
        unique_together = [["doc", "tag"]]
