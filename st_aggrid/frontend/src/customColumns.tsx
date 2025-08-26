import { compareAsc, format, parseISO } from "date-fns"

import { duration } from "moment"


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
  numberColumnFilter: {
    filter: "agNumberColumnFilter",
  },
  shortDateTimeFormat: {
    valueFormatter: (params: any) =>
      dateFormatter(params.value, "dd/MM/yyyy HH:mm"),
  },
  timedeltaFormat: {
    valueFormatter: (params: any) => duration(params.value).humanize(true),
  },
}

export {columnFormaters}