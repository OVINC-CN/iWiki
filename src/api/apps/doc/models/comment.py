# pylint: disable=R0801

from django.db import models, transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy
from ovinc_client.core.models import BaseModel, ForeignKey, UniqIDField


class CommentBase(BaseModel):
    """
    Comment Base
    """

    id = UniqIDField(gettext_lazy("ID"), primary_key=True)
    doc = ForeignKey(gettext_lazy("Doc"), to="doc.Doc", on_delete=models.CASCADE)
    content = models.TextField(gettext_lazy("Content"))
    owner = ForeignKey(gettext_lazy("Owner"), to="account.User", on_delete=models.CASCADE)
    updated_at = models.DateTimeField(gettext_lazy("Updated Time"), db_index=True)
    created_at = models.DateTimeField(gettext_lazy("Created Time"), db_index=True)

    class Meta:
        abstract = True


class Comment(CommentBase):
    """
    Comment
    """

    class Meta:
        verbose_name = gettext_lazy("Comment")
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    @transaction.atomic()
    def delete(self, *args, **kwargs) -> None:
        comment_bin = CommentBin()
        for field in self._meta.fields:  # pylint: disable=E1101
            setattr(comment_bin, field.name, getattr(self, field.name))
        comment_bin.deleted_at = timezone.now()
        comment_bin.save()
        return super().delete(*args, **kwargs)


class CommentBin(CommentBase):
    """
    Comment Bin
    """

    deleted_at = models.DateTimeField(gettext_lazy("Deleted Time"), db_index=True)

    class Meta:
        verbose_name = gettext_lazy("Comment Bin")
        verbose_name_plural = verbose_name
        ordering = ["-deleted_at"]
