from enum import Enum, IntEnum, Flag, auto, EnumMeta
import json, re, pathlib
from typing import Literal, Optional

DEFAULT_COLUMN_PROPS = [
    "cellDataType",
    "checkboxSelection",
    "suppressNavigable",
    "editable",
    "cellEditorPopupPosition",
    "singleClickEdit",
    "useValueParserForImport",
    "autoHeaderHeight",
    "suppressHeaderMenuButton",
    "suppressHeaderFilterButton",
    "suppressHeaderContextMenu",
    "headerCheckboxSelectionFilteredOnly",
    "headerCheckboxSelectionCurrentPageOnly",
    "lockPinned",
    "enablePivot",
    "autoHeight",
    "wrapText",
    "enableCellChangeFlash",
    "rowDrag",
    "rowGroup",
    "enableRowGroup",
    "enableValue",
    "defaultAggFunc",
    "sortable",
    "unSortIcon",
    "resizable",
    "suppressSizeToFit",
    "suppressAutoSize",
    "marryChildren",
    "suppressStickyLabel",
    "openByDefault",
    "suppressColumnsToolPanel",
    "suppressFiltersToolPanel",
    "suppressSpanHeaderHeight",
    "filter",
]


def getAllGridOptions():
    jsonRoot = pathlib.Path(__file__).parent / "json"
    allOptions = json.load(open(jsonRoot / "gridOptions.json"))
    return allOptions


def getAllColumnProps():
    jsonRoot = pathlib.Path(__file__).parent / "json"
    allProps = json.load(open(jsonRoot / "columnProps.json"))
    return allProps


def getAllGridEvents():
    jsonRoot = pathlib.Path(__file__).parent / "json"
    allGridEvents = json.load(open(jsonRoot / "gridEvents.json"))
    return allGridEvents


class MetaEnum(EnumMeta):
    def __contains__(cls, item):
        try:
            cls(item)
        except ValueError:
            return False
        return True


class BaseEnum(Enum, metaclass=MetaEnum):
    pass


class GridUpdateMode(Flag):
    NO_UPDATE = auto()
    MANUAL = auto()
    VALUE_CHANGED = auto()
    SELECTION_CHANGED = auto()
    FILTERING_CHANGED = auto()
    SORTING_CHANGED = auto()
    COLUMN_RESIZED = auto()
    COLUMN_MOVED = auto()
    COLUMN_PINNED = auto()
    COLUMN_VISIBLE = auto()
    MODEL_CHANGED = (
        VALUE_CHANGED | SELECTION_CHANGED | FILTERING_CHANGED | SORTING_CHANGED
    )
    COLUMN_CHANGED = COLUMN_RESIZED | COLUMN_MOVED | COLUMN_VISIBLE | COLUMN_PINNED
    GRID_CHANGED = MODEL_CHANGED | COLUMN_CHANGED


class DataReturnMode(IntEnum):
    AS_INPUT = 0
    FILTERED = 1
    FILTERED_AND_SORTED = 2


class ColumnsAutoSizeMode(IntEnum):
    NO_AUTOSIZE = 0
    FIT_ALL_COLUMNS_TO_VIEW = 1
    FIT_CONTENTS = 2


class ExcelExportMode(BaseEnum):
    NONE = "NONE"
    MANUAL = "MANUAL"  # Add a download button to the grid
    FILE_BLOB_IN_GRID_RESPONSE = "FILE_BLOB_IN_GRID_RESPONSE"  # include in grid's return an Excel Blob Property with file binary encoded as B64 String
    TRIGGER_DOWNLOAD = "TRIGGER_DOWNLOAD"  # After Grid Refreshes triggers the download.
    SHEET_BLOB_IN_GRID_RESPONSE = "SHEET_BLOB_IN_GRID_RESPONSE"  # include in grid's return a SheetlBlob Property with sheet binary encoded as B64 String. Meant to be used with MULTIPLE
    MULTIPLE_SHEETS = "MULTIPLE_SHEETS"  # Triggers the download and add other B64 encoded sheets. Send sheets as a list using excel_export_extra_sheets parameter


_comment_re = re.compile(r'/\*[\s\S]*?\*/|(?<![:\\])//.*$', re.MULTILINE)
_whitespace_re = re.compile(r'\s+')
# stole from https://github.com/andfanilo/streamlit-echarts/blob/master/streamlit_echarts/frontend/src/utils.js Thanks andfanilo
def JsCode(js_code):
    js_code = _comment_re.sub('', js_code)
    js_code = _whitespace_re.sub(' ', js_code).strip()
    return f"::JSCODE::{js_code}::JSCODE::"


def walk_gridOptions(go, func):
    """Recursively walk grid options applying func at each leaf node

    Args:
        go (dict): gridOptions dictionary
        func (callable): a function to apply at leaf nodes
    """
    from collections.abc import Mapping

    if isinstance(go, (Mapping, list)):
        for i, k in enumerate(go):
            if isinstance(go[k], Mapping):
                walk_gridOptions(go[k], func)
            elif isinstance(go[k], list):
                for j in go[k]:
                    walk_gridOptions(j, func)
            else:
                go[k] = func(go[k])


def fetch_grid_options_from_site():
    import itertools
    import requests
    from bs4 import BeautifulSoup

    # Fetch the URL text
    url = "https://ag-grid.com/react-data-grid/grid-options/"
    response = requests.get(url)

    # Parse the HTML text
    soup = BeautifulSoup(response.text, "html.parser")

    result = []

    for r in soup.select("tr"):
        c1, c2 = r.select("td")
        element = c1.select_one("h6._name_1pw3t_115 > span").text
        labels = [p.text for p in c1.select("span._metaLabel_1pw3t_162")]
        values = [p.text for p in c1.select("span._metaValue_1pw3t_167")]
        args = dict(itertools.zip_longest(labels, values))
        description = c2.text
        i = {"name": element, "props": args, "description": description}
        result.append(i)

    import json

    return json.dumps(result, indent=4)


# suclassing a dict because it is JSON serializable.
class StAggridTheme(dict):
    def __init__(self, base: Optional[Literal["alpine", "balham", "quartz"]] = None):
        super().__init__()
        self["params"] = {}
        self["parts"] = list()
        if base is not None:
            self["themeName"] = "custom"
            self.base(base)

    def base(self, base: Literal["alpine", "balham", "quartz"]):
        self["base"] = base

    def withParams(self, **params):
        self["params"].update(params)
        return self

    def withParts(self, *parts):
        self["parts"] = list(set(self["parts"]).union(set(parts)))
        return self
