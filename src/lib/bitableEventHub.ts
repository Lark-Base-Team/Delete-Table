import { bitable, Selection, ITableMeta, IBase, ITable } from '@lark-base-open/js-sdk'

type Unsubscribe = () => void

function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<(v: T) => void>()
  const get = () => value
  const set = (v: T) => {
    value = v
    listeners.forEach(l => l(value))
  }
  const subscribe = (l: (v: T) => void): Unsubscribe => {
    listeners.add(l)
    l(value)
    return () => listeners.delete(l)
  }
  return { get, set, subscribe }
}

const selectionStore = createStore<Selection | null>(null)
const DEBUG = false
let selectionStarted = false
let selectionUnsub: Unsubscribe | null = null

async function ensureSelectionLive() {
  if (selectionStarted) return
  selectionStarted = true
  try {
    const snapshot = await bitable.base.getSelection()
    selectionStore.set(snapshot)
    if (DEBUG) console.log('Selection snapshot', snapshot)
  } catch {}
  selectionUnsub = bitable.base.onSelectionChange(ev => {
    selectionStore.set(ev.data)
    if (DEBUG) console.log('Selection change', ev.data)
  })
}

function stopSelectionLive() {
  if (selectionUnsub) {
    selectionUnsub()
    selectionUnsub = null
  }
  selectionStarted = false
}

const tablesMetaStore = createStore<ITableMeta[]>([])
let tablesMetaStarted = false
let tableAddUnsub: Unsubscribe | null = null
let tableDeleteUnsub: Unsubscribe | null = null

async function refreshTablesMeta() {
  try {
    const list = await bitable.base.getTableMetaList()
    tablesMetaStore.set(list)
    if (DEBUG) console.log('Tables meta refresh', list)
  } catch {}
}

async function ensureTablesMetaLive() {
  if (tablesMetaStarted) return
  tablesMetaStarted = true
  await refreshTablesMeta()
  tableAddUnsub = bitable.base.onTableAdd(() => {
    refreshTablesMeta()
  })
  tableDeleteUnsub = bitable.base.onTableDelete(() => {
    refreshTablesMeta()
  })
}

function stopTablesMetaLive() {
  tableAddUnsub?.()
  tableAddUnsub = null
  tableDeleteUnsub?.()
  tableDeleteUnsub = null
  tablesMetaStarted = false
}

type TableLive = {
  tableId: string
  getTable: () => Promise<ITable>
}

function createTableLive(tableId: string): TableLive {
  const getTable = () => bitable.base.getTableById(tableId)
  return { tableId, getTable }
}

export const bitableEventHub = {
  selection: {
    ensure: ensureSelectionLive,
    stop: stopSelectionLive,
    subscribe: selectionStore.subscribe,
    get: selectionStore.get
  },
  tablesMeta: {
    ensure: ensureTablesMetaLive,
    stop: stopTablesMetaLive,
    subscribe: tablesMetaStore.subscribe,
    get: tablesMetaStore.get
  },
  createTableLive
}
