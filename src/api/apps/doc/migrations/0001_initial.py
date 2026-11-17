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
            name="Doc",
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
                ("title", models.TextField(verbose_name="Title")),
                ("content", models.TextField(verbose_name="Content")),
                ("header_img", models.TextField(blank=True, null=True, verbose_name="Header Image")),
                ("is_public", models.BooleanField(db_index=True, default=False, verbose_name="Is Public")),
                ("pv", models.BigIntegerField(db_index=True, default=int, verbose_name="PV")),
                ("updated_at", models.DateTimeField(db_index=True, verbose_name="Updated Time")),
                ("created_at", models.DateTimeField(db_index=True, verbose_name="Created Time")),
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
                "verbose_name": "Doc",
                "verbose_name_plural": "Doc",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Tag",
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
                ("name", models.CharField(max_length=32, unique=True, verbose_name="Name")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Created Time")),
            ],
            options={
                "verbose_name": "Tag",
                "verbose_name_plural": "Tag",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="DocBin",
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
                ("title", models.TextField(verbose_name="Title")),
                ("content", models.TextField(verbose_name="Content")),
                ("header_img", models.TextField(blank=True, null=True, verbose_name="Header Image")),
                ("is_public", models.BooleanField(db_index=True, default=False, verbose_name="Is Public")),
                ("pv", models.BigIntegerField(db_index=True, default=int, verbose_name="PV")),
                ("updated_at", models.DateTimeField(db_index=True, verbose_name="Updated Time")),
                ("created_at", models.DateTimeField(db_index=True, verbose_name="Created Time")),
                ("deleted_at", models.DateTimeField(db_index=True, verbose_name="Deleted Time")),
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
                "verbose_name": "Doc Bin",
                "verbose_name_plural": "Doc Bin",
                "ordering": ["-deleted_at"],
            },
        ),
        migrations.CreateModel(
            name="CommentBin",
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
                ("content", models.TextField(verbose_name="Content")),
                ("updated_at", models.DateTimeField(db_index=True, verbose_name="Updated Time")),
                ("created_at", models.DateTimeField(db_index=True, verbose_name="Created Time")),
                ("deleted_at", models.DateTimeField(db_index=True, verbose_name="Deleted Time")),
                (
                    "doc",
                    ovinc_client.core.models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="doc.doc",
                        verbose_name="Doc",
                    ),
                ),
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
                "verbose_name": "Comment Bin",
                "verbose_name_plural": "Comment Bin",
                "ordering": ["-deleted_at"],
            },
        ),
        migrations.CreateModel(
            name="Comment",
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
                ("content", models.TextField(verbose_name="Content")),
                ("updated_at", models.DateTimeField(db_index=True, verbose_name="Updated Time")),
                ("created_at", models.DateTimeField(db_index=True, verbose_name="Created Time")),
                (
                    "doc",
                    ovinc_client.core.models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="doc.doc",
                        verbose_name="Doc",
                    ),
                ),
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
                "verbose_name": "Comment",
                "verbose_name_plural": "Comment",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="DocTag",
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
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Created Time")),
                (
                    "doc",
                    ovinc_client.core.models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="doc.doc",
                        verbose_name="Doc",
                    ),
                ),
                (
                    "tag",
                    ovinc_client.core.models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="doc.tag",
                        verbose_name="Tag",
                    ),
                ),
            ],
            options={
                "verbose_name": "Doc Tag",
                "verbose_name_plural": "Doc Tag",
                "ordering": ["-created_at"],
                "unique_together": {("doc", "tag")},
            },
        ),
    ]
