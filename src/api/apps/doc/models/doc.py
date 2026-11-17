# pylint: disable=R0801

from typing import List

from django.db import models, transaction
from django.db.models import F
from django.utils import timezone
from django.utils.translation import gettext_lazy
from ovinc_client.core.models import BaseModel, ForeignKey, UniqIDField

from apps.doc.models.tag import DocTag, Tag


class DocBase(BaseModel):
    """
    Doc Base
    """

    id = UniqIDField(gettext_lazy("ID"), primary_key=True)
    title = models.TextField(gettext_lazy("Title"))
    content = models.TextField(gettext_lazy("Content"))
    header_img = models.TextField(gettext_lazy("Header Image"), null=True, blank=True)
    is_public = models.BooleanField(gettext_lazy("Is Public"), default=False, db_index=True)
    pv = models.BigIntegerField(gettext_lazy("PV"), default=int, db_index=True)
    owner = ForeignKey(gettext_lazy("Owner"), to="account.User", on_delete=models.CASCADE)
    updated_at = models.DateTimeField(gettext_lazy("Updated Time"), db_index=True)
    created_at = models.DateTimeField(gettext_lazy("Created Time"), db_index=True)

    class Meta:
        abstract = True

    def __str__(self) -> str:
        return f"{self.title} ({self.id})"


class Doc(DocBase):
    """
    Doc
    """

    class Meta:
        verbose_name = gettext_lazy("Doc")
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    @transaction.atomic()
    def delete(self, *args, **kwargs) -> None:
        doc_bin = DocBin()
        for field in self._meta.fields:  # pylint: disable=E1101
            setattr(doc_bin, field.name, getattr(self, field.name))
        doc_bin.deleted_at = timezone.now()
        doc_bin.save()
        return super().delete(*args, **kwargs)

    def bind_tags(self, tags: List[dict]) -> None:
        Tag.objects.bulk_create([Tag(name=tag) for tag in tags], ignore_conflicts=True)
        tags = Tag.objects.filter(name__in=tags)
        DocTag.objects.bulk_create([DocTag(tag=tag, doc=self) for tag in tags], ignore_conflicts=True)
        DocTag.objects.filter(doc=self).exclude(tag__in=tags).delete()

    @transaction.atomic()
    def record_read(self):
        self.__class__.objects.select_for_update().filter(id=self.id).update(pv=F("pv") + 1)


class DocBin(DocBase):
    """
    Doc Bin
    """

    deleted_at = models.DateTimeField(gettext_lazy("Deleted Time"), db_index=True)

    class Meta:
        verbose_name = gettext_lazy("Doc Bin")
        verbose_name_plural = verbose_name
        ordering = ["-deleted_at"]
