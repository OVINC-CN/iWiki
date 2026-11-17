import re

from django.utils.translation import gettext_lazy
from ovinc_client.core.models import TextChoices

MD_URL_RE = re.compile(r"\[([^\]]+)\]\((http[s]?://[^\)]+)\)")
HTML_TAG_URL_RE = re.compile(r'src="(http[s]?://[^"]+)"')


class DocSearchType(TextChoices):
    """
    Doc Search Type
    """

    TITLE = "title", gettext_lazy("Title")
    CONTENT = "content", gettext_lazy("Content")
    ALL = "all", gettext_lazy("All")
