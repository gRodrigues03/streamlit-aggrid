import { compareAsc, format, parseISO } from "date-fns"

//TODO: mover formaters to gridOptionsBuilder options
function dateFormatter(isoString: string, formaterString: string): String {
  try {
    let date = parseISO(isoString)
    return format(date, formaterString)
  } catch {
    return isoString
  } finally {
  }
}

const columnFormaters = {
  dateColumnFilter: {
    filter: "agDateColumnFilter",
    filterParams: {
      comparator: (filterValue: any, cellValue: string) =>
        compareAsc(parseISO(cellValue), filterValue),
    },
  },
  shortDateTimeFormat: {
    valueFormatter: (params: any) =>
      dateFormatter(params.value, "dd/MM/yyyy HH:mm"),
  },
}

export {columnFormaters}