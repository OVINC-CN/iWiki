# pylint: disable=C0103,R0801

import django.db.models.deletion
import ovinc_client.core.models
import ovinc_client.core.utils
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserPermission",
            fields=[
                (
                    "id",
                    ovinc_client.core.models.UniqIDField(
                        default=ovinc_client.core.utils.uniq_id_without_time,
                        max_length=32,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "permission_item",
                    models.CharField(
                        choices=[("create_doc", "Create Doc"), ("upload_file", "Upload File")],
                        max_length=32,
                        verbose_name="Permission Item",
                    ),
                ),
                ("expired_at", models.DateTimeField(blank=True, null=True, verbose_name="Expired Time")),
                ("authed_at", models.DateTimeField(auto_now_add=True, verbose_name="Authorized Time")),
                (
                    "user",
                    ovinc_client.core.models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="User",
                    ),
                ),
            ],
            options={
                "verbose_name": "User Permission",
                "verbose_name_plural": "User Permission",
                "ordering": ["-authed_at"],
                "unique_together": {("user", "permission_item")},
                "index_together": {("user", "expired_at"), ("user", "permission_item", "expired_at")},
            },
        ),
    ]
