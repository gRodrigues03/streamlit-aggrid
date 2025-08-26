import os, json, warnings, typing, re, inspect
import streamlit as st
import streamlit.components.v1 as components
import pandas as pd
import numpy as np
from typing import Any, Mapping, Tuple, Union, Literal, Optional
from enum import IntEnum, Flag, Enum, auto
from collections import defaultdict


GRID_OPTIONS = ['statusBar', 'sideBar', 'getContextMenuItems', 'suppressContextMenu', 'preventDefaultOnContextMenu', 'allowContextMenuWithControlKey', 'getMainMenuItems', 'columnMenu', 'suppressMenuHide', 'popupParent', 'postProcessPopup', 'copyHeadersToClipboard', 'copyGroupHeadersToClipboard', 'clipboardDelimiter', 'suppressCutToClipboard', 'suppressCopyRowsToClipboard', 'suppressCopySingleCellRanges', 'suppressLastEmptyLineOnPaste', 'suppressClipboardPaste', 'suppressClipboardApi', 'processCellForClipboard', 'processHeaderForClipboard', 'processGroupHeaderForClipboard', 'processCellFromClipboard', 'sendToClipboard', 'processDataFromClipboard', 'columnDefs', 'defaultColDef', 'defaultColGroupDef', 'columnTypes', 'dataTypeDefinitions', 'maintainColumnOrder', 'suppressFieldDotNotation', 'headerHeight', 'groupHeaderHeight', 'floatingFiltersHeight', 'pivotHeaderHeight', 'pivotGroupHeaderHeight', 'allowDragFromColumnsToolPanel', 'suppressMovableColumns', 'suppressColumnMoveAnimation', 'suppressDragLeaveHidesColumns', 'suppressRowGroupHidesColumns', 'processUnpinnedColumns', 'colResizeDefault', 'autoSizeStrategy', 'suppressAutoSize', 'autoSizePadding', 'skipHeaderOnAutoSize', 'components', 'editType', 'singleClickEdit', 'suppressClickEdit', 'stopEditingWhenCellsLoseFocus', 'enterNavigatesVertically', 'enterNavigatesVerticallyAfterEdit', 'enableCellEditingOnBackspace', 'undoRedoCellEditing', 'undoRedoCellEditingLimit', 'readOnlyEdit', 'defaultCsvExportParams', 'suppressCsvExport', 'defaultExcelExportParams', 'suppressExcelExport', 'excelStyles', 'quickFilterText', 'cacheQuickFilter', 'includeHiddenColumnsInQuickFilter', 'quickFilterParser', 'quickFilterMatcher', 'isExternalFilterPresent', 'doesExternalFilterPass', 'excludeChildrenWhenTreeDataFiltering', 'enableAdvancedFilter', 'includeHiddenColumnsInAdvancedFilter', 'advancedFilterParent', 'advancedFilterBuilderParams', 'enableCharts', 'suppressChartToolPanelsButton', 'getChartToolbarItems', 'createChartContainer', 'chartThemes', 'customChartThemes', 'chartThemeOverrides', 'chartToolPanelsDef', 'chartMenuItems', 'navigateToNextHeader', 'tabToNextHeader', 'navigateToNextCell', 'tabToNextCell', 'loadingCellRenderer', 'loadingCellRendererParams', 'loadingCellRendererSelector', 'localeText', 'getLocaleText', 'masterDetail', 'isRowMaster', 'detailCellRenderer', 'detailCellRendererParams', 'detailRowHeight', 'detailRowAutoHeight', 'embedFullWidthRows', 'keepDetailRows', 'keepDetailRowsCount', 'initialState', 'alignedGrids', 'context', 'tabIndex', 'rowBuffer', 'valueCache', 'valueCacheNeverExpires', 'enableCellExpressions', 'getDocument', 'suppressTouch', 'suppressFocusAfterRefresh', 'suppressBrowserResizeObserver', 'suppressPropertyNamesCheck', 'suppressChangeDetection', 'debug', 'reactiveCustomComponents', 'overlayLoadingTemplate', 'loadingOverlayComponent', 'loadingOverlayComponentParams', 'suppressLoadingOverlay', 'overlayNoRowsTemplate', 'noRowsOverlayComponent', 'noRowsOverlayComponentParams', 'suppressNoRowsOverlay', 'pagination', 'paginationPageSize', 'paginationPageSizeSelector', 'paginationNumberFormatter', 'paginationAutoPageSize', 'paginateChildRows', 'suppressPaginationPanel', 'pivotMode', 'pivotPanelShow', 'pivotDefaultExpanded', 'pivotColumnGroupTotals', 'pivotRowTotals', 'pivotSuppressAutoColumn', 'pivotMaxGeneratedColumns', 'processPivotResultColDef', 'processPivotResultColGroupDef', 'suppressExpandablePivotGroups', 'functionsReadOnly', 'aggFuncs', 'getGroupRowAgg', 'suppressAggFuncInHeader', 'alwaysAggregateAtRootLevel', 'aggregateOnlyChangedColumns', 'suppressAggFilteredOnly', 'groupAggFiltering', 'removePivotHeaderRowWhenSingleValueColumn', 'animateRows', 'cellFlashDuration', 'cellFadeDuration', 'allowShowChangeAfterFilter', 'domLayout', 'ensureDomOrder', 'getBusinessKeyForNode', 'gridId', 'processRowPostCreate', 'enableRtl', 'suppressColumnVirtualisation', 'suppressRowVirtualisation', 'suppressMaxRenderedRowRestriction', 'rowDragManaged', 'rowDragEntireRow', 'rowDragMultiRow', 'suppressRowDrag', 'suppressMoveWhenRowDragging', 'rowDragText', 'fullWidthCellRenderer', 'fullWidthCellRendererParams', 'groupDisplayType', 'groupDefaultExpanded', 'autoGroupColumnDef', 'groupMaintainOrder', 'groupSelectsChildren', 'groupLockGroupColumns', 'groupIncludeFooter', 'groupIncludeTotalFooter', 'groupSuppressBlankHeader', 'groupSelectsFiltered', 'showOpenedGroup', 'isGroupOpenByDefault', 'initialGroupOrderComparator', 'groupRemoveSingleChildren', 'groupRemoveLowestSingleChildren', 'groupHideOpenParents', 'groupAllowUnbalanced', 'rowGroupPanelShow', 'rowGroupPanelSuppressSort', 'groupRowRenderer', 'groupRowRendererParams', 'suppressDragLeaveHidesColumns', 'suppressGroupRowsSticky', 'suppressRowGroupHidesColumns', 'suppressMakeColumnVisibleAfterUnGroup', 'treeData', 'getDataPath', 'pinnedTopRowData', 'pinnedBottomRowData', 'rowModelType', 'getRowId', 'rowData', 'resetRowDataOnUpdate', 'asyncTransactionWaitMillis', 'suppressModelUpdateAfterUpdateTransaction', 'datasource', 'cacheOverflowSize', 'maxConcurrentDatasourceRequests', 'cacheBlockSize', 'maxBlocksInCache', 'infiniteInitialRowCount', 'serverSideDatasource', 'cacheBlockSize', 'maxBlocksInCache', 'maxConcurrentDatasourceRequests', 'blockLoadDebounceMillis', 'purgeClosedRowNodes', 'serverSidePivotResultFieldSeparator', 'serverSideSortAllLevels', 'serverSideEnableClientSideSort', 'serverSideOnlyRefreshFilteredGroups', 'serverSideInitialRowCount', 'getChildCount', 'getServerSideGroupLevelParams', 'isServerSideGroupOpenByDefault', 'isApplyServerSideTransaction', 'isServerSideGroup', 'getServerSideGroupKey', 'viewportDatasource', 'viewportRowModelPageSize', 'viewportRowModelBufferSize', 'alwaysShowHorizontalScroll', 'alwaysShowVerticalScroll', 'debounceVerticalScrollbar', 'suppressHorizontalScroll', 'suppressScrollOnNewData', 'suppressScrollWhenPopupsAreOpen', 'suppressAnimationFrame', 'suppressMiddleClickScrolls', 'suppressPreventDefaultOnMouseWheel', 'scrollbarWidth', 'rowSelection', 'rowMultiSelectWithClick', 'isRowSelectable', 'suppressRowDeselection', 'suppressRowClickSelection', 'suppressCellFocus', 'suppressHeaderFocus', 'suppressMultiRangeSelection', 'enableCellTextSelection', 'enableRangeSelection', 'enableRangeHandle', 'enableFillHandle', 'fillHandleDirection', 'fillOperation', 'suppressClearOnFillReduction', 'sortingOrder', 'accentedSort', 'unSortIcon', 'suppressMultiSort', 'alwaysMultiSort', 'multiSortKey', 'suppressMaintainUnsortedOrder', 'postSortRows', 'deltaSort', 'icons', 'rowHeight', 'getRowHeight', 'rowStyle', 'getRowStyle', 'rowClass', 'getRowClass', 'rowClassRules', 'isFullWidthRow', 'suppressRowHoverHighlight', 'suppressRowTransform', 'columnHoverHighlight', 'enableBrowserTooltips', 'tooltipShowDelay', 'tooltipHideDelay', 'tooltipMouseTrack', 'tooltipShowMode', 'tooltipTrigger', 'tooltipInteraction', 'gridOptions']
COLUMN_PROPS = ['field', 'colId', 'type', 'cellDataType', 'valueGetter', 'valueFormatter', 'refData', 'keyCreator', 'equals', 'checkboxSelection', 'showDisabledCheckboxes', 'toolPanelClass', 'suppressColumnsToolPanel', 'columnGroupShow', 'icons', 'suppressNavigable', 'suppressKeyboardEvent', 'suppressPaste', 'suppressFillHandle', 'contextMenuItems', 'cellAriaRole', 'hide', 'initialHide', 'lockVisible', 'lockPosition', 'suppressMovable', 'useValueFormatterForExport', 'editable', 'valueSetter', 'valueParser', 'cellEditor', 'cellEditorParams', 'cellEditorSelector', 'cellEditorPopup', 'cellEditorPopupPosition', 'singleClickEdit', 'useValueParserForImport', 'onCellValueChanged', 'onCellClicked', 'onCellDoubleClicked', 'onCellContextMenu', 'filter', 'filterParams', 'filterValueGetter', 'getQuickFilterText', 'floatingFilter', 'floatingFilterComponent', 'floatingFilterComponentParams', 'suppressFiltersToolPanel', 'headerName', 'headerValueGetter', 'headerTooltip', 'headerClass', 'headerComponent', 'headerComponentParams', 'wrapHeaderText', 'autoHeaderHeight', 'menuTabs', 'columnChooserParams', 'mainMenuItems', 'suppressHeaderMenuButton', 'suppressHeaderFilterButton', 'suppressHeaderContextMenu', 'suppressHeaderKeyboardEvent', 'headerCheckboxSelection', 'headerCheckboxSelectionFilteredOnly', 'headerCheckboxSelectionCurrentPageOnly', 'suppressFloatingFilterButton', 'chartDataType', 'pinned', 'initialPinned', 'lockPinned', 'pivot', 'initialPivot', 'pivotIndex', 'initialPivotIndex', 'pivotComparator', 'enablePivot', 'cellStyle', 'cellClass', 'cellClassRules', 'cellRenderer', 'cellRendererParams', 'cellRendererSelector', 'autoHeight', 'wrapText', 'enableCellChangeFlash', 'rowDrag', 'rowDragText', 'rowGroup', 'initialRowGroup', 'rowGroupIndex', 'initialRowGroupIndex', 'enableRowGroup', 'showRowGroup', 'enableValue', 'aggFunc', 'initialAggFunc', 'allowedAggFuncs', 'defaultAggFunc', 'sortable', 'sort', 'initialSort', 'sortIndex', 'initialSortIndex', 'sortingOrder', 'comparator', 'unSortIcon', 'colSpan', 'rowSpan', 'tooltipField', 'tooltipValueGetter', 'tooltipComponent', 'tooltipComponentParams', 'width', 'initialWidth', 'minWidth', 'maxWidth', 'flex', 'initialFlex', 'resizable', 'suppressSizeToFit', 'suppressAutoSize', 'children *', 'groupId', 'marryChildren', 'suppressStickyLabel', 'openByDefault', 'columnGroupShow', 'toolPanelClass', 'suppressColumnsToolPanel', 'suppressFiltersToolPanel', 'suppressSpanHeaderHeight', 'tooltipComponent', 'tooltipComponentParams', 'headerName', 'headerClass', 'headerTooltip', 'headerGroupComponent', 'headerGroupComponentParams']

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

    MODEL_CHANGED = VALUE_CHANGED | SELECTION_CHANGED | FILTERING_CHANGED | SORTING_CHANGED
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


class ExcelExportMode(str, Enum):  # use str mixin so values compare nicely to strings
    NONE = "NONE"
    MANUAL = "MANUAL"
    FILE_BLOB_IN_GRID_RESPONSE = "FILE_BLOB_IN_GRID_RESPONSE"
    TRIGGER_DOWNLOAD = "TRIGGER_DOWNLOAD"
    SHEET_BLOB_IN_GRID_RESPONSE = "SHEET_BLOB_IN_GRID_RESPONSE"
    MULTIPLE_SHEETS = "MULTIPLE_SHEETS"


class GridOptionsBuilder:
    """Builder for gridOptions dictionary"""

    def __init__(self):
        def ddict():
            return defaultdict(ddict)

        self.__grid_options = ddict()
        self.sideBar: dict = dict()

    @staticmethod
    def from_dataframe(dataframe, columns=(), **default_column_parameters):
        type_mapper = {"b":["textColumn"],"i":["numericColumn","numberColumnFilter"],"u":["numericColumn","numberColumnFilter"],"f":["numericColumn","numberColumnFilter"],"c":[],"m":["timedeltaFormat"],"M":["dateColumnFilter","shortDateTimeFormat"],"O":[],"S":[],"U":[],"V":[]}

        gb = GridOptionsBuilder()

        # Vectorized default parameters
        col_params = {k: v for k, v in default_column_parameters.items() if k in COLUMN_PROPS}
        grid_params = {k: v for k, v in default_column_parameters.items() if k in GRID_OPTIONS}

        if col_params:
            gb.configure_default_column(**col_params)
        if grid_params:
            gb.configure_grid_options(**grid_params)

        # Convert dataframe columns to string once
        df_cols = dataframe.columns.astype(str)

        # Filter input columns if provided
        if columns:
            columns = [col for col in columns if col in df_cols]
        else:
            columns = df_cols

        # Suppress dot notation if any column has '.'
        if any("." in col for col in columns):
            gb.configure_grid_options(suppressFieldDotNotation=True)

        # Precompute types for all columns
        dtypes_map = {col: dataframe[col].dtype.kind for col in df_cols}

        # Group columns by type
        type_to_columns = {}
        for col in columns:
            col_type_kind = dtypes_map[col]
            type_to_columns.setdefault(col_type_kind, []).append(col)

        # Configure columns in batches by type
        for col_type, cols in type_to_columns.items():
            col_type_config = type_mapper.get(col_type, [])
            for col_name in cols:
                gb.configure_column(field=col_name, type=col_type_config)

        # Final grid options
        gb.configure_grid_options(autoSizeStrategy={'type': 'fitCellContents', 'skipHeader': False})

        return gb

    def configure_default_column(
        self,
        **other_default_column_properties
    ):
        """Configure default column.

        Args:
            min_column_width (int, optional):
                Minimum column width. Defaults to 100.

            resizable (bool, optional):
                All columns will be resizable. Defaults to True.

            sortable (bool, optional):
                All columns will be sortable. Defaults to True.

            groupable (bool, optional):
                All columns will be groupable based on row values. Defaults to True.

            editable (bool, optional):
                All columns will be editable. Defaults to True.

            groupable (bool, optional):
                All columns will be groupable. Defaults to True.

            **other_default_column_properties:
                Key value pairs that will be merged to defaultColDef dict.
                Chech ag-grid documentation.
        """

        self.__grid_options["defaultColDef"] = {**self.__grid_options["defaultColDef"], **other_default_column_properties}

    def configure_grid_options(self, **props):
        """Merges props to gridOptions

        Args:
            props: props dicts will be merged to gridOptions root.
        """
        self.__grid_options.update(props)

    def configure_columns(self, column_names=(), **props):
        """Batch configures columns. Key-pair values from props dict will be merged
        to colDefs which field property is in column_names list.

        Args:
            column_names (list, optional):
                columns field properties. If any of colDefs matches **props dict is merged.
                Defaults to [].
        """
        for k in self.__grid_options["columnDefs"]:
            if k in column_names:
                self.__grid_options["columnDefs"][k].update(props)

    def configure_column(self, field=None, header_name=None, **other_column_properties):
        """Configures an individual column
        check https://www.ag-grid.com/javascript-grid-column-properties/ for more information.

        Args:
            field (String): field name, usually equals the column header.
            header_name (String, optional): The display name of the column. Defaults to None.
        """
        if not self.__grid_options.get("columnDefs", None):
            self.__grid_options["columnDefs"] = defaultdict(dict)

        if field is not None:
            colDef = {
                "headerName": field if header_name is None else header_name,
                "field": field,
            }
        else:
            colDef = {
                "headerName": ''
            }

        if other_column_properties:
            colDef = {**colDef, **other_column_properties}

        self.__grid_options["columnDefs"][field].update(colDef)

    def configure_side_bar(
        self, filters_panel=True, columns_panel=True, defaultToolPanel=""
    ):
        """configures the side panel of ag-grid.
           Side panels are enterprise features, please check www.ag-grid.com

        Args:
            filters_panel (bool, optional):
                Enable filters side panel. Defaults to True.

            columns_panel (bool, optional):
                Enable columns side panel. Defaults to True.

            defaultToolPanel (str, optional): The default tool panel that should open when grid renders.
                                              Either "filters" or "columns".
                                              If value is blank, panel will start closed (default)
        """
        filter_panel = {
            "id": "filters",
            "labelDefault": "Filters",
            "labelKey": "filters",
            "iconKey": "filter",
            "toolPanel": "agFiltersToolPanel",
        }

        column_panel = {
            "id": "columns",
            "labelDefault": "Columns",
            "labelKey": "columns",
            "iconKey": "columns",
            "toolPanel": "agColumnsToolPanel",
        }

        if filters_panel or columns_panel:
            sideBar = {"toolPanels": [], "defaultToolPanel": defaultToolPanel}

            if filters_panel:
                sideBar["toolPanels"].append(filter_panel)
            if columns_panel:
                sideBar["toolPanels"].append(column_panel)

            self.__grid_options["sideBar"] = sideBar

    def configure_selection(
        self,
        selection_mode: str = "single",
        use_checkbox: bool = False,
        header_checkbox: bool = False,
        header_checkbox_filtered_only: bool = True,
        pre_selected_rows: list = None,
        rowMultiSelectWithClick: bool = False,
        suppressRowDeselection: bool = False,
        suppressRowClickSelection: bool = False,
        groupSelectsChildren: bool = True,
        groupSelectsFiltered: bool = True,
    ):
        """Configure grid selection features

        Args:
            selection_mode (str, optional):
                Either 'single', 'multiple' or 'disabled'. Defaults to 'single'.

            use_checkbox (bool, optional):
                Set to true to have checkbox next to each row.

            header_checkbox (bool, optional):
                Set to true to have a checkbox in the header to select all rows.

            header_checkbox_filtered_only (bool, optional):
                If header_checkbox is set to True, once the header checkbox is clicked, returned rows depend on this parameter.
                If this is set to True, only filtered (shown) rows will be selected and returned.
                If this is set to False, the whole dataframe (all rows regardless of the applited filter) will be selected and returned.

            pre_selected_rows (list, optional):
                Use list of dataframe row iloc index to set corresponding rows as selected state on load. Defaults to None.

            rowMultiSelectWithClick (bool, optional):
                If False user must hold shift to multiselect. Defaults to True if selection_mode is 'multiple'.

            suppressRowDeselection (bool, optional):
                Set to true to prevent rows from being deselected if you hold down Ctrl and click the row
                (i.e. once a row is selected, it remains selected until another row is selected in its place).
                By default the grid allows deselection of rows.
                Defaults to False.

            suppressRowClickSelection (bool, optional):
                Supress row selection by clicking. Usefull for checkbox selection for instance
                Defaults to False.

            groupSelectsChildren (bool, optional):
                When rows are grouped selecting a group select all children.
                Defaults to True.

            groupSelectsFiltered (bool, optional):
                When a group is selected filtered rows are also selected.
                Defaults to True.
        """
        if selection_mode == "disabled":
            self.__grid_options.pop("rowSelection", None)
            self.__grid_options.pop("rowMultiSelectWithClick", None)
            self.__grid_options.pop("suppressRowDeselection", None)
            self.__grid_options.pop("suppressRowClickSelection", None)
            self.__grid_options.pop("groupSelectsChildren", None)
            self.__grid_options.pop("groupSelectsFiltered", None)
            return

        if use_checkbox:
            suppressRowClickSelection = True
            first_key = next(iter(self.__grid_options["columnDefs"].keys()))
            self.__grid_options["columnDefs"][first_key]["checkboxSelection"] = True
            if header_checkbox:
                self.__grid_options["columnDefs"][first_key][
                    "headerCheckboxSelection"
                ] = True
                if header_checkbox_filtered_only:
                    self.__grid_options["columnDefs"][first_key][
                        "headerCheckboxSelectionFilteredOnly"
                    ] = True

        if pre_selected_rows:
            # self.__grid_options["preSelectedRows"] = pre_selected_rows
            self.__grid_options['initialState']['rowSelection'] = pre_selected_rows

        self.__grid_options["rowSelection"] = selection_mode
        self.__grid_options["rowMultiSelectWithClick"] = rowMultiSelectWithClick
        self.__grid_options["suppressRowDeselection"] = suppressRowDeselection
        self.__grid_options["suppressRowClickSelection"] = suppressRowClickSelection
        self.__grid_options["groupSelectsChildren"] = (
            groupSelectsChildren and selection_mode == "multiple"
        )
        self.__grid_options["groupSelectsFiltered"] = groupSelectsFiltered

    def configure_pagination(
        self, enabled=True, paginationAutoPageSize=True, paginationPageSize=10
    ):
        """Configure grid's pagination features

        Args:
            enabled (bool, optional):
                Self explanatory. Defaults to True.

            paginationAutoPageSize (bool, optional):
                Calculates optimal pagination size based on grid Height. Defaults to True.

            paginationPageSize (int, optional):
                Forces page to have this number of rows per page. Defaults to 10.
        """
        if not enabled:
            self.__grid_options.pop("pagination", None)
            self.__grid_options.pop("paginationAutoPageSize", None)
            self.__grid_options.pop("paginationPageSize", None)
            return

        self.__grid_options["pagination"] = True
        if paginationAutoPageSize:
            self.__grid_options["paginationAutoPageSize"] = paginationAutoPageSize
        else:
            self.__grid_options["paginationPageSize"] = paginationPageSize

    def configure_first_column_as_index(
        self,
        suppressMenu: bool = True,
        headerText: str = "",
        resizable=False,
        sortable=True,
    ):
        """
        Configures the first column definition to look as an index column.

        Args:
            suppressMenu (bool, optional): Suppresses the header menu for the index col. Defaults to True.
            headerText (str, optional): Header for the index column. Defaults to empty string.
            resizable (bool, optional): Make index column resizable. Defaults to False.
            sortable (bool, optional): Make index column sortable. Defaults to True.

        """

        index_options = {
            "minWidth": 0,
            "cellStyle": {"color": "white", "background-color": "gray"},
            "pinned": "left",
            "resizable": resizable,
            "sortable": sortable,
            "suppressMovable": True,
            "suppressMenu": suppressMenu,
            "menuTabs": ["filterMenuTab"],
        }
        first_col_def = next(iter(self.__grid_options["columnDefs"]))

        self.configure_column(first_col_def, headerText, **index_options)

    def build(self):
        """Builds the gridOptions dictionary

        Returns:
            dict: Returns a dicionary containing the configured grid options
        """
        self.__grid_options["columnDefs"] = list(
            self.__grid_options["columnDefs"].values()
        )

        return self.__grid_options


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


class AgGridReturn(Mapping):
    """Class to hold AgGrid call return"""

    def __init__(
        self,
        originalData,
        gridOptions=None,
        data_return_mode=DataReturnMode.AS_INPUT,
        try_to_convert_back_to_original_types=True,
        conversion_errors="corce",
    ) -> None:
        super().__init__()

        self.__component_value_set = False

        self.__original_data = originalData
        self.__try_to_convert_back_to_original_types = (
            try_to_convert_back_to_original_types
        )
        self.__conversion_errors = conversion_errors
        self.__data_return_mode = data_return_mode

        self.__dict__["grid_response"] = {"gridOptions": gridOptions}

    def _set_component_value(self, component_value):
        self.__component_value_set = True

        self.__dict__["grid_response"] = component_value
        if isinstance(self.__dict__["grid_response"]["gridOptions"], dict):
            pass
        else:
            self.__dict__["grid_response"]["gridOptions"] = json.loads(
                self.__dict__["grid_response"]["gridOptions"]
            )

    @property
    def grid_response(self):
        """Raw response from component."""
        return self.__dict__["grid_response"]

    @property
    def rows_id_after_sort_and_filter(self):
        """The row indexes after sort and filter is applied"""
        return self.grid_response.get("rowIdsAfterSortAndFilter")

    @property
    def rows_id_after_filter(self):
        """The filtered row indexes"""
        return self.grid_response.get("rowIdsAfterFilter")

    @property
    def grid_options(self):
        """GridOptions as applied on the grid."""
        return self.grid_response.get("gridOptions", {})

    @property
    def columns_state(self):
        """Gets the state of the columns. Typically used when saving column state."""
        return self.grid_response.get("columnsState")

    @property
    def grid_state(self):
        """Gets the grid state. Tipically used on initialState option. (https://ag-grid.com/javascript-data-grid//grid-options/#reference-miscellaneous-initialState)"""
        return self.grid_response.get("gridState")

    @property
    def selected_rows_id(self):
        """Ids of selected rows"""
        return self.grid_state.get("rowSelection")

    def __process_vanilla_df_response(
        self, nodes, __try_to_convert_back_to_original_types
    ):
        data = pd.DataFrame(
            [n.get("data", {}) for n in nodes if not n.get("group", False) == True]
        )

        if "__pandas_index" in data.columns:
            data.index = pd.Index(data["__pandas_index"], name="index")
            del data["__pandas_index"]

        if __try_to_convert_back_to_original_types:
            original_types = self.grid_response["originalDtypes"]
            try:
                original_types.pop("__pandas_index")
            except:
                pass

            numeric_columns = [
                k for k, v in original_types.items() if v in ["i", "u", "f"]
            ]
            if numeric_columns:
                data.loc[:, numeric_columns] = data.loc[:, numeric_columns].apply(
                    pd.to_numeric, errors=self.__conversion_errors
                )

            text_columns = [
                k for k, v in original_types.items() if v in ["O", "S", "U"]
            ]

            if text_columns:
                data.loc[:, text_columns] = data.loc[:, text_columns].applymap(
                    lambda x: np.nan if x is None else str(x)
                )

            date_columns = [k for k, v in original_types.items() if v == "M"]
            if date_columns:
                data.loc[:, date_columns] = data.loc[:, date_columns].apply(
                    pd.to_datetime, errors=self.__conversion_errors
                )

            timedelta_columns = [k for k, v in original_types.items() if v == "m"]
            if timedelta_columns:

                def cast_to_timedelta(s):
                    try:
                        return pd.Timedelta(s)
                    except:
                        return s

                data.loc[:, timedelta_columns] = data.loc[:, timedelta_columns].apply(
                    cast_to_timedelta
                )

        return data

    @staticmethod
    def __process_grouped_response(
        nodes, __try_to_convert_back_to_original_types, __data_return_mode
    ):
        def travel_parent(o):
            if o.get("parent", None) is None:
                return ""

            return rf"""{travel_parent(o.get("parent"))}.{o.get("parent").get("key")}""".lstrip(
                "."
            )

        data = [
            {**i.get("data"), **{"parent": travel_parent(i)}}
            for i in nodes
            if i.get("group", False) == False
        ]
        data = pd.DataFrame(data).set_index("__pandas_index")
        data.index.name = ""
        groups = [
            {tuple(v1.split(".")[1:]): v2.drop("parent", axis=1)}
            for v1, v2 in data.groupby("parent")
        ]
        return groups

    def __get_data(self, onlySelected):
        data = self.__original_data

        if self.__component_value_set:
            nodes = self.grid_response.get("nodes", [])

            if onlySelected:
                nodes = list(filter(lambda n: n.get("isSelected", False), nodes))

                if not nodes:
                    return None

            reindex_ids_map = {
                DataReturnMode.FILTERED: self.rows_id_after_filter,
                DataReturnMode.FILTERED_AND_SORTED: self.rows_id_after_sort_and_filter,
            }

            reindex_ids = reindex_ids_map.get(self.__data_return_mode, None)

            if isinstance(data, pd.DataFrame) and not data.empty:
                data = self.__process_vanilla_df_response(
                    nodes, self.__try_to_convert_back_to_original_types and onlySelected
                )

                if reindex_ids:
                    reindex_ids = pd.Index(reindex_ids)

                    if onlySelected:
                        reindex_ids = reindex_ids.intersection(data.index)

                    data = data.reindex(index=reindex_ids)
                    return data

            # TODO: imporove json testing.
            elif (
                (isinstance(data, str) and (json.loads(data)))
                or (isinstance(data, pd.DataFrame) and data.empty)
                or (data is None)
            ):
                return json.dumps(
                    [
                        n["data"]
                        for n in list(sorted(nodes, key=lambda n: n["rowIndex"]))
                        if n["id"] in reindex_ids
                    ]
                )

        if not onlySelected:
            return data

    @property
    def data(self):
        """Data from the grid. If rows are grouped, return only the leaf rows"""

        return self.__get_data(onlySelected=False)

    @property
    def selected_data(self):
        """Selected Data from the grid."""

        return self.__get_data(onlySelected=True)

    def __get_dataGroups(self, onlySelected):
        if self.__component_value_set:
            nodes = self.grid_response.get("nodes", [])

            if onlySelected:
                # n.get('isSelected', True). Default is true bc agGrid sets undefined for half selected groups
                nodes = list(filter(lambda n: n.get("isSelected", True) == True, nodes))

                if not nodes:
                    return [{"": self.__get_data(onlySelected)}]

            response_has_groups = any((n.get("group", False) for n in nodes))

            if response_has_groups:
                data = self.__process_grouped_response(
                    nodes,
                    self.__try_to_convert_back_to_original_types,
                    self.__data_return_mode,
                )
                return data

        return [{"": self.__get_data(onlySelected)}]

    @property
    def dataGroups(self):
        """returns grouped rows as a dictionary where keys are tuples of groupby strings and values are pandas.DataFrame"""

        return self.__get_dataGroups(onlySelected=False)

    @property
    def selected_dataGroups(self):
        """returns selected rows as a dictionary where keys are tuples of grouped column names and values are pandas.DataFrame"""

        return self.__get_dataGroups(onlySelected=True)

    @property
    def selected_rows(self):
        """Returns with selected rows. If there are grouped rows return a dict of {key:pd.DataFrame}"""
        selected_items = pd.DataFrame(self.grid_response.get("selectedItems", {}))

        if selected_items.empty:
            return None

        if "__pandas_index" in selected_items.columns:
            selected_items.set_index("__pandas_index", inplace=True)
            selected_items.index.name = "index"

        return selected_items

    # TODO: implement event returns
    @property
    def event_data(self):
        """Returns information about the event that triggered AgGrid Response"""
        return self.grid_response.get("eventData", None)

    # Backwards compatibility with dict interface
    def __getitem__(self, __k):
        try:
            return getattr(self, __k)
        except AttributeError:
            return self.__dict__.__getitem__(__k)

    def __iter__(self):
        attrs = (x for x in inspect.getmembers(self) if not x[0].startswith("_"))
        return attrs.__iter__()

    def __len__(self):
        attrs = [x for x in inspect.getmembers(self) if not x[0].startswith("_")]
        return attrs.__len__()

    def keys(self):
        return [x[0] for x in inspect.getmembers(self) if not x[0].startswith("_")]

    def values(self):
        return [x[1] for x in inspect.getmembers(self) if not x[0].startswith("_")]


_comment_re = re.compile(r'/\*[\s\S]*?\*/|(?<![:\\])//.*$', re.MULTILINE)
_whitespace_re = re.compile(r'\s+')
# stole from https://github.com/andfanilo/streamlit-echarts/blob/master/streamlit_echarts/frontend/src/utils.js Thanks andfanilo
def JsCode(js_code):
    js_code = _comment_re.sub('', js_code)
    js_code = _whitespace_re.sub(' ', js_code).strip()
    return f"::JSCODE::{js_code}::JSCODE::"

# This function exists because pandas behaviour when converting tz aware datetime to iso format.
def __cast_date_columns_to_iso8601(dataframe: pd.DataFrame):
    """Internal Method to convert tz-aware datetime columns to correct ISO8601 format"""
    for c, d in dataframe.dtypes.items():
        if d.kind == "M":
            dataframe[c] = dataframe[c].apply(lambda s: s.isoformat())


def __parse_row_data(data) -> Tuple[Any, Any]:
    """Internal method to process data from data_parameter"""
    # no data received, render an empty grid if gridOptions is present
    if data is None:
        return [], None

    elif isinstance(data, pd.DataFrame):
        data_parameter = data.copy()
        __cast_date_columns_to_iso8601(data_parameter)
        # creates an index column that uniquely identify the rows, this index will be used in AgGrid getRowId call on the Javascript side.
        data_parameter["__pandas_index"] = [
            str(i) for i in range(data_parameter.shape[0])
        ]
        row_data = data_parameter.to_json(orient="records", date_format="iso")
        frame_dtypes = dict(
            zip(data_parameter.columns, (t.kind for t in data_parameter.dtypes))
        )
        del data_parameter["__pandas_index"]
        return json.loads(row_data), frame_dtypes
    else:
        raise ValueError("Invalid data")


def __parse_grid_options(
    gridOptions_parameter, data, default_column_parameters
):
    """Internal method to cast gridOptions parameter to a valid gridoptions"""
    # if no gridOptions is passed, builds a default one.
    if (gridOptions_parameter is None) and not (data is None):
        gb = GridOptionsBuilder.from_dataframe(data, **default_column_parameters)
        gridOptions = gb.build()

    # if it is a dict-like object, assumes is valid and use it.
    elif isinstance(gridOptions_parameter, Mapping):
        gridOptions = gridOptions_parameter
    else:
        raise ValueError("gridOptions is invalid.")

    return gridOptions


_component_func = components.declare_component("agGrid", path=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "build"))

def AgGrid(
    data: Union[pd.DataFrame, str] = None,
    gridOptions: typing.Dict = None,
    height: int = 400,
    fit_columns_on_grid_load=False,
    data_return_mode: DataReturnMode = DataReturnMode.FILTERED_AND_SORTED,
    allow_unsafe_jscode: bool = False,
    enable_enterprise_modules: bool = False,
    license_key: str = None,
    try_to_convert_back_to_original_types: bool = True,
    conversion_errors: str = "coerce",
    columns_state=None,
    theme: str | StAggridTheme = None,
    custom_css=None,
    key: typing.Any = None,
    update_on=(),
    callback=None,
    show_toolbar: bool = False,
    show_search: bool = True,
    show_download_button: bool = True,
    **default_column_parameters,
) -> AgGridReturn:
    """Renders a DataFrame using AgGrid.

    Parameters
    ----------
    data : pd.DataFrame
        The underlying dataframe to be used.

    gridOptions : typing.Dict, optional
        A dictionary of options for ag-grid. Documentation on www.ag-grid.com
        If None, default grid options will be created with GridOptionsBuilder.from_dataframe() call.
        Default: None

    height : int, optional
        The grid height in pixels.
        If None, grid will enable Auto Height by default https://www.ag-grid.com/react-data-grid/grid-size/#dom-layout
        Default: None

    fit_columns_on_grid_load : bool, optional
        DEPRECATED, use columns_auto_size_mode
        Use gridOptions autoSizeStrategy (https://www.ag-grid.com/javascript-data-grid/column-sizing/#auto-sizing-columns)


    update_on: list[string | tuple[string, int]], optional
        Defines the events that will trigger a refresh and grid return on the Streamlit app.
        Valid string-named events are listed in https://www.ag-grid.com/javascript-data-grid/grid-events/.
        If a tuple[string, int] is present on the list, that event will be debounced by x milliseconds.
        For instance:
            if update_on = ['cellValueChanged', ("columnResized", 500)]
            The grid will return when cell values are changed AND when columns are resized, however the latter will
            be debounced by 500 ms. More information about debounced functions
            here: https://www.freecodecamp.org/news/javascript-debounce-example/

    callback: callable, optional
        Defines a function that will be called on change. One argument will be passed to the function
        which will be an AgGridReturn object in the same fashion as what is returned by this class.
        Requires key to be set.

    data_return_mode : DataReturnMode, optional
        Defines how the data will be retrieved from the component's client side. One of:
            DataReturnMode.AS_INPUT             -> Returns grid data as inputted. Includes cell edits.
            DataReturnMode.FILTERED             -> Returns filtered grid data, maintains input order.
            DataReturnMode.FILTERED_AND_SORTED  -> Returns grid data filtered and sorted.
        Defaults to DataReturnMode.FILTERED_AND_SORTED.

    allow_unsafe_jscode : bool, optional
        Allows jsCode to be injected in gridOptions.
        Defaults to False.

    enable_enterprise_modules : bool, optional
        Loads Ag-Grid enterprise modules (check licensing).
        Defaults to False.

    license_key : str, optional
        License key to use for enterprise modules.
        By default None.

    try_to_convert_back_to_original_types : bool, optional
        Attempts to convert data retrieved from the grid to original types.
        Defaults to True.

    conversion_errors : str, optional
        Behavior when conversion fails. One of:
            'raise'     -> Invalid parsing will raise an exception.
            'coerce'    -> Invalid parsing will be set as NaT/NaN.
            'ignore'    -> Invalid parsing will return the input.
        Defaults to 'coerce'.

    columns_state : dict, optional
        Allows setting the initial state of columns (e.g., visibility, order, etc.).
        Defaults to None.

    theme : str | StAggridTheme, optional
        Theme used by ag-grid. One of:

            'streamlit' -> Follows default Streamlit colors.
            'light'     -> Ag-grid balham-light theme.
            'dark'      -> Ag-grid balham-dark theme.
            'blue'      -> Ag-grid blue theme.
            'fresh'     -> Ag-grid fresh theme.
            'material'  -> Ag-grid material theme.
        By default 'streamlit'.

    custom_css : dict, optional
        Custom CSS rules to be added to the component's iframe.
        Defaults to None.

    key : typing.Any, optional
        Streamlit's key argument. Check Streamlit's documentation.
        Defaults to None.

    show_toolbar : bool, optional
        Whether to show the toolbar above the grid.
        Defaults to True.

    show_search : bool, optional
        Whether to show the search bar in the toolbar.
        Defaults to True.

    show_download_button : bool, optional
        Whether to show the download button in the toolbar.
        Defaults to True.

    **default_column_parameters:
        Other parameters will be passed as key:value pairs on gridOptions defaultColDef.

    Returns
    -------
    AgGridReturn
        Returns an AgGridReturn object containing the grid's data and other metadata.
    """

    if isinstance(theme, StAggridTheme) or isinstance(theme, dict):
        themeObj = theme

    elif theme is None:
        themeObj = "streamlit"
    else:
        raise ValueError(
            f"{theme} is not valid."
        )

    # Parse return Mode
    if not isinstance(data_return_mode, (str, DataReturnMode)):
        raise ValueError(
            "DataReturnMode should be either a DataReturnMode enum value or a string."
        )
    elif isinstance(data_return_mode, str):
        try:
            data_return_mode = DataReturnMode[data_return_mode.upper()]
        except:
            raise ValueError(f"{data_return_mode} is not valid.")

    # Parse gridOptions
    gridOptions = __parse_grid_options(
        gridOptions, data, default_column_parameters
    )

    frame_dtypes = []

    # rowData in grid options have precedence and are assumed to be correct json.
    if "rowData" not in gridOptions:
        row_data, frame_dtypes = __parse_row_data(data)
        gridOptions["rowData"] = row_data

    if not isinstance(data, pd.DataFrame):
        try_to_convert_back_to_original_types = False

    custom_css = custom_css or dict()

    if height is None:
        gridOptions["domLayout"] = "autoHeight"

    if fit_columns_on_grid_load:
        warnings.warn(
            DeprecationWarning(
                "fit_columns_on_grid_load is deprecated and will be removed on next version."
            )
        )
        gridOptions["autoSizeStrategy"] = {"type": "fitGridWidth"}

    response = AgGridReturn(
        data,
        gridOptions,
        data_return_mode,
        try_to_convert_back_to_original_types,
        conversion_errors,
    )

    if callback and not key:
        raise ValueError("Component key must be set to use a callback.")
    elif key and not callback:
        # This allows the table to keep its state up to date (eg #176)
        def _inner_callback():
            response._set_component_value(st.session_state[key])
    elif callback and key:
        # User defined callback
        def _inner_callback():
            response._set_component_value(st.session_state[key])
            return callback(response)
    else:
        _inner_callback = None

    try:
        component_value = _component_func(
            gridOptions=gridOptions,
            height=height,
            data_return_mode=data_return_mode,
            frame_dtypes=frame_dtypes,
            allow_unsafe_jscode=allow_unsafe_jscode,
            enable_enterprise_modules=enable_enterprise_modules,
            license_key=license_key,
            default=None,
            columns_state=columns_state,
            theme=themeObj,
            custom_css=custom_css,
            update_on=update_on,
            key=key,
            on_change=_inner_callback,
            show_toolbar=show_toolbar,
            show_search=show_search,
            show_download_button=show_download_button,
        )

    except Exception as ex:  # components.components.MarshallComponentException as ex:
        # uses a more complete error message.
        args = list(ex.args)
        args[0] += (
            ". If you're using custom JsCode objects on gridOptions, ensure that allow_unsafe_jscode is True."
        )
        # ex = components.components.MarshallComponentException(*args)
        raise ex

    if component_value:
        response._set_component_value(component_value)

    return response
