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
            name="COSLog",
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
                ("filename", models.CharField(max_length=255, verbose_name="File Name")),
                ("key", models.CharField(max_length=255, unique=True, verbose_name="File Path")),
                ("resp", models.JSONField(blank=True, null=True, verbose_name="Response")),
                ("uploaded_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Uploaded Time")),
                (
                    "owner",
                    ovinc_client.core.models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Owner",
                    ),
                ),
            ],
            options={
                "verbose_name": "COS Log",
                "verbose_name_plural": "COS Log",
                "ordering": ["-uploaded_at"],
            },
        ),
    ]
