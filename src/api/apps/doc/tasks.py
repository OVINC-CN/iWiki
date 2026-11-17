from django.db import transaction
from ovinc_client.core.lock import task_lock
from ovinc_client.core.logger import celery_logger

from apps.cel import app
from apps.doc.models import DocTag, Tag


@app.task(bind=True)
@task_lock()
@transaction.atomic()
def remove_unused_tags(self):
    celery_logger.info("[RemoveUnusedTags] Start %s", self.request.id)
    doc_tags = DocTag.objects.select_for_update().all().values("tag")
    to_delete = Tag.objects.select_for_update().exclude(id__in=doc_tags)
    celery_logger.info(
        "[RemoveUnusedTags] ToDelete %s", ";".join([t.name for t in to_delete]) if to_delete.count() else "<Empty>"
    )
    to_delete.delete()
    celery_logger.info("[RemoveUnusedTags] End %s", self.request.id)
