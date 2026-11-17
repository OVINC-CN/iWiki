from django.contrib import admin
from django.utils.translation import gettext_lazy

from apps.doc.models import Comment, CommentBase, CommentBin, Doc, DocBin, DocTag, Tag


class DocBaseAdmin:
    list_display = ["id", "title", "header_img", "is_public", "pv", "owner", "updated_at", "created_at"]


@admin.register(Doc)
class DocAdmin(DocBaseAdmin, admin.ModelAdmin):
    list_display = DocBaseAdmin.list_display + ["tags"]
    list_filter = ["is_public"]

    @admin.display(description=gettext_lazy("Tags"))
    def tags(self, inst: Doc) -> str:
        return ";".join(list(DocTag.objects.filter(doc=inst).values_list("tag__name", flat=True)))


@admin.register(DocBin)
class DocBinAdmin(DocBaseAdmin, admin.ModelAdmin):
    list_display = DocBaseAdmin.list_display + ["deleted_at"]


class CommentBaseAdmin:
    list_display = ["id", "doc_title", "owner", "updated_at", "created_at"]

    @admin.display(description=gettext_lazy("Title"))
    def doc_title(self, inst: CommentBase) -> str:
        return inst.doc.title


@admin.register(Comment)
class CommentAdmin(CommentBaseAdmin, admin.ModelAdmin):
    pass


@admin.register(CommentBin)
class CommentBinAdmin(CommentBaseAdmin, admin.ModelAdmin):
    list_display = CommentBaseAdmin.list_display + ["deleted_at"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "created_at"]


@admin.register(DocTag)
class DocTagAdmin(admin.ModelAdmin):
    list_display = ["id", "doc_title", "tag_name"]

    @admin.display(description=gettext_lazy("Title"))
    def doc_title(self, inst: DocTag) -> str:
        return inst.doc.title

    @admin.display(description=gettext_lazy("Name"))
    def tag_name(self, inst: DocTag) -> str:
        return inst.tag.name
