# pylint: disable=C0103,R0801

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("permission", "0001_initial"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="userpermission",
            new_name="permission__user_id_897a17_idx",
            old_fields=("user", "expired_at"),
        ),
        migrations.RenameIndex(
            model_name="userpermission",
            new_name="permission__user_id_9e7ed3_idx",
            old_fields=("user", "permission_item", "expired_at"),
        ),
    ]
