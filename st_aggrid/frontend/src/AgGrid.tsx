import { AgGridReact } from "ag-grid-react"
import React, { ReactNode } from "react"

import {
  ComponentProps,
  Streamlit,
  withStreamlitConnection,
} from "streamlit-component-lib"

import {
  AllCommunityModule,
  DetailGridInfo,
  GetRowIdParams,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ModuleRegistry,
} from "ag-grid-community"

import { AG_GRID_LOCALE_BR } from '@ag-grid-community/locale'

import { AllEnterpriseModule, LicenseManager } from "ag-grid-enterprise"

import {debounce, cloneDeep, every, isEqual} from "lodash"

import { format, parseISO } from "date-fns"
import { parseTheme } from "./ThemeParser"
import { getGridReturnValue } from "./utils/agGridReturnUtils"

import "./AgGrid.css"

import GridToolBar from "./components/GridToolBar"

interface State {
    gridHeight: number
    gridOptions: GridOptions
    isRowDataEdited: boolean
    api?: GridApi
    enterprise_features_enabled: boolean
}

function deepMap<T>(obj: T, fn: (v: any) => any, keysToIgnore: string[] = []): T {
    if (Array.isArray(obj)) return obj.map(v => deepMap(v, fn, keysToIgnore)) as unknown as T;

    if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [
                k,
                keysToIgnore.includes(k) ? v : deepMap(v, fn, keysToIgnore)
            ])
        ) as T;
    }
    return fn(obj);
}


function addCustomCSS(custom_css: string): void {
    const style = document.createElement("style");
    style.textContent = custom_css
    document.head.appendChild(style)
}

let runtimeArgs: { [key: string]: any } = {};

const funcs = {

    cellClickHandlerEscalaInsert_fd(p: any) {
        const linhas_permitidas = runtimeArgs.linhas_permitidas;
        const ddfc = runtimeArgs.ddfc;

        if (p.newValue === null) {
            p.node.setDataValue(p.column.colId, null);
            return;
        }
        if (p.newValue === '') {
            p.node.setDataValue(p.column.colId, '');
            return;
        }

        if (p.column.colId === 'MATRICULA') {
            if (!ddfc.includes(String(p.newValue))) {
                alert('Matrícula inválida');

                if (p.oldValue === null) { p.node.setDataValue(p.column.colId, ''); return; }

                if (!ddfc.includes(String(p.oldValue))) {
                    p.node.setDataValue(p.column.colId, '');
                    return;
                }

                p.node.setDataValue(p.column.colId, p.oldValue);
                return;
            }
            p.node.setDataValue(p.column.colId, p.newValue);
        }
        else if (p.column.colId === 'PT') {
            let res = p.newValue.toUpperCase();
            if (linhas_permitidas.includes(res)) {
                p.node.setDataValue('PT', res);
                return;
            } else { alert('PT ' + res + ' não cadastrado');
                p.node.setDataValue('PT', '');
                return;
            }
        }
    },

    cellClickHandlerDiaria_fd(p: any) {
        const folgando = runtimeArgs.retira_folga;
        const impedidos = runtimeArgs.imp;
        const ddfc = runtimeArgs.ddfc;
        const clickedColumn = p.column.colId;
        const clickedValue = p.node.data[clickedColumn];
        if (clickedValue === null) {
            p.node.setDataValue(p.column.colId, null);
            return;
        }
        if (clickedValue === '') {
            p.node.setDataValue(p.column.colId, '');
            return;
        }
        if (clickedColumn === 'MATRICULA') {
            if (!ddfc.includes(String(clickedValue))) {
                alert('Matrícula inválida');
                if (p.oldValue === null) { p.node.setDataValue(p.column.colId, null); return; }
                if (!ddfc.includes(String(p.oldValue))) {
                    p.node.setDataValue(p.column.colId, null);
                    return;
                }
                p.node.setDataValue(p.column.colId, p.oldValue);
                return;
            }
            p.node.setDataValue(p.column.colId, clickedValue);
            if (impedidos.includes(clickedValue)) { alert(`Funcionário ${clickedValue} possui ocorrência`); }
            if (folgando.includes(clickedValue)) { alert(`Funcionário ${clickedValue} está de folga`); }
            return;
        }
    },

    cellClickHandlerMensal_fd(p: any) {
        const padroes = runtimeArgs.padroes;
        const ddfc = runtimeArgs.ddfc;
        const clickedColumn = p.column.colId;
        const clickedValue = p.node.data[clickedColumn];

        if (clickedColumn !== 'FOLGA') {
            if (clickedValue === null) {
                p.node.setDataValue(p.column.colId, null);
                return;
            }
            if (clickedValue === '') {
                p.node.setDataValue(p.column.colId, '');
                return;
            }
        }

        if (clickedColumn === 'MATRICULA') {
            if (!ddfc.includes(String(clickedValue))) {
                alert('Matrícula inválida');

                if (p.oldValue === null) { p.node.setDataValue(p.column.colId, null); return; }

                if (!ddfc.includes(String(p.oldValue))) {
                    p.node.setDataValue(p.column.colId, null);
                    return;
                }

                p.node.setDataValue(p.column.colId, p.oldValue);
                return;
            }
            p.node.setDataValue(p.column.colId, clickedValue);
        }
        else if (clickedColumn === 'PADRAO_FOLGA') {
            const temp = clickedValue.toUpperCase();
            p.node.setDataValue('PADRAO_FOLGA', temp);
            p.node.setDataValue('PADRAO_ALTERADO', 0);

            try { p.node.setDataValue('FOLGA', padroes[temp].split(', ')); }
            catch { p.node.setDataValue('FOLGA', []); }
            return;
        }
        else if (clickedColumn === 'FOLGA') {
            let FOLGA = clickedValue;
            if (FOLGA === null) { p.node.setDataValue('PADRAO_FOLGA', ''); p.node.setDataValue('FOLGA', []); p.node.setDataValue('PADRAO_ALTERADO', 0); return; }
            let PADRAO_FOLGA = p.node.data['PADRAO_FOLGA'].toUpperCase();
            if (FOLGA.length > 0) { if (FOLGA[0] == '') { FOLGA = FOLGA.slice(1); } }
            if (FOLGA.length === 0) { p.node.setDataValue('PADRAO_FOLGA', ''); p.node.setDataValue('PADRAO_ALTERADO', 0); return; }
            try {
                if ((clickedValue == padroes[PADRAO_FOLGA]) || (clickedValue.join(', ') == padroes[PADRAO_FOLGA])) {
                    p.node.setDataValue('PADRAO_ALTERADO', 0);
                    p.node.setDataValue('FOLGA', FOLGA);
                    return;
                }
            } catch {
                p.node.setDataValue('PADRAO_ALTERADO', 1);
                p.node.setDataValue('FOLGA', FOLGA);
                return;
            }
            p.node.setDataValue('PADRAO_ALTERADO', 1);
            p.node.setDataValue('FOLGA', FOLGA);
            return;
        }
    },


    cellClickHandlerDiaria(params: any) {
        const folgando = runtimeArgs.retira_folga;
        const escalamensal = runtimeArgs.dict_escala_mensal;
        const impedidos = runtimeArgs.imp;
        const ddfc = runtimeArgs.ddfc;
        const clickedColumn = params.column.colId;
        const clickedValue = params.node.data[clickedColumn];
        if ((clickedValue === '') || (clickedValue === null)) {
            params.node.setDataValue(params.column.colId, '');
            return;
        }
        if (clickedColumn === 'MOTORISTA') {
            if (!ddfc.includes(clickedValue)) {
                alert('Motorista desconhecido');
                if (params.oldValue === null) { params.node.setDataValue(params.column.colId, ''); return; }
                if (!ddfc.includes(params.oldValue)) {
                    params.node.setDataValue(params.column.colId, '');
                    return;
                }
                params.node.setDataValue(params.column.colId, params.oldValue);
                return;
            }
            params.node.setDataValue(params.column.colId, clickedValue);
            if (impedidos.includes(Number(clickedValue))) { alert(`Motorista ${clickedValue} possui ocorrência`); }
            if (folgando.includes(clickedValue)) { alert(`Motorista ${clickedValue} está de folga`); }
            if (params.node.data['TURNO'] == 1) {
                if (escalamensal['LINHA'][clickedValue].slice(0, 2) != '99') {
                    if (runtimeArgs.nome_linhas[params.node.data['LINHA']].slice(0, 5) !== 'PLANT' && String(escalamensal['CARRO'][clickedValue]) != 'None' && params.node.data['LINHA'] == escalamensal['LINHA'][clickedValue]) {
                        params.node.setDataValue('CARRO', escalamensal['CARRO'][clickedValue]);
                    }
                }
            }
            return;
        }
    },

    motoristaColorEscalaDiaria(params: any) {
        const folgando = runtimeArgs.retira_folga;

        const impedidos = runtimeArgs.imp;

        if (params.value === null) { return {
            backgroundColor: null,
                color: null,
                fontWeight: null
        }; }
        if (impedidos.includes(Number(params.value))) {
            return {
                backgroundColor: '#ffcccc',
                    color: '#000',
                    fontWeight: 'bold'
            };
        }
        if (folgando.includes(params.value)) {
            return {
                backgroundColor: '#f0f0aa',
                    color: '#000',
                    fontWeight: 'bold'
            };
        }
        return {
            backgroundColor: null,
                color: null,
                fontWeight: null
        };
    },

    cellClickHandlerEscalaInsert(params: any) {
        const linhas_permitidas = runtimeArgs.linhas_permitidas;
        const ddfc = runtimeArgs.ddfc;

        const clickedColumn = params.column.colId;
        const clickedValue = params.node.data[clickedColumn];

        if (((clickedValue === '') || (clickedValue === null)) && clickedColumn !== 'FOLGA') {
            params.node.setDataValue(params.column.colId, '');
            return;
        }

        if (clickedColumn === 'MOTORISTA') {
            if (!ddfc.includes(clickedValue)) {
                alert('Motorista desconhecido');

                if (params.oldValue === null) { params.node.setDataValue(params.column.colId, ''); return; }

                if (!ddfc.includes(params.oldValue)) {
                    params.node.setDataValue(params.column.colId, '');
                    return;
                }

                params.node.setDataValue(params.column.colId, params.oldValue);
                return;
            }
            params.node.setDataValue(params.column.colId, clickedValue);
        }
        else if (clickedColumn === 'LINHA'){
            let res = clickedValue.toUpperCase();
            let resp = clickedValue.toUpperCase() + 'P';
            let rest = clickedValue.toUpperCase() + 'T';
            let resi = clickedValue.toUpperCase() + 'I';
            if (linhas_permitidas.includes(res)) {
                params.node.setDataValue('LINHA', res);
                return;
            } else if (linhas_permitidas.includes(resp)) {
                params.node.setDataValue('LINHA', resp);
                return;
            } else if (linhas_permitidas.includes(rest)) {
                params.node.setDataValue('LINHA', rest);
                return;
            } else if (linhas_permitidas.includes(resi)) {
                params.node.setDataValue('LINHA', resi);
                return;
            } else { alert('Linha ' + res + ' não cadastrada para a empresa ' + runtimeArgs.empresa);
                params.node.setDataValue('LINHA', '');
                return; }
        }
        else if (clickedColumn === 'GARAGEM') {
            if (clickedValue > '09:40') { params.node.setDataValue('TURNO', 2); }
            else { params.node.setDataValue('TURNO', 1); }
        }
    },

    cellClickHandlerMensal(params: any) {
        const padroes = runtimeArgs.padroes;
        const ddfc = runtimeArgs.ddfc;
        const clickedColumn = params.column.colId;
        const clickedValue = params.node.data[clickedColumn];

        if (((clickedValue === '') || (clickedValue === null)) && clickedColumn !== 'FOLGA') {
            params.node.setDataValue(params.column.colId, '');
            return;
        }

        if (clickedColumn === 'MOTORISTA') {
            if (!ddfc.includes(clickedValue)) {
                alert('Motorista desconhecido');

                if (params.oldValue === null) { params.node.setDataValue(params.column.colId, ''); return; }

                if (!ddfc.includes(params.oldValue)) {
                    params.node.setDataValue(params.column.colId, '');
                    return;
                }

                params.node.setDataValue(params.column.colId, params.oldValue);
                return;
            }
            params.node.setDataValue(params.column.colId, clickedValue);
        }
        else if (clickedColumn === 'PADRAO_FOLGA') {
            const temp = clickedValue.toUpperCase();
            params.node.setDataValue('PADRAO_FOLGA', temp);
            params.node.setDataValue('PADRAO_ALTERADO', 0);

            try { params.node.setDataValue('FOLGA', padroes[temp].split(', ')); }
            catch { params.node.setDataValue('FOLGA', []); }
            return;
        }
        else if (clickedColumn === 'FOLGA') {
            let FOLGA = clickedValue;
            if (FOLGA === null) { params.node.setDataValue('PADRAO_FOLGA', ''); params.node.setDataValue('FOLGA', []); params.node.setDataValue('PADRAO_ALTERADO', 0); return; }
            let PADRAO_FOLGA = params.node.data['PADRAO_FOLGA'].toUpperCase();
            if (FOLGA.length > 0) { if (FOLGA[0] == '') { FOLGA = FOLGA.slice(1); } }
            if (FOLGA.length === 0) { params.node.setDataValue('PADRAO_FOLGA', ''); params.node.setDataValue('PADRAO_ALTERADO', 0); return; }
            try {
                if ((clickedValue == padroes[PADRAO_FOLGA]) || (clickedValue.join(', ') == padroes[PADRAO_FOLGA])) {
                    params.node.setDataValue('PADRAO_ALTERADO', 0);
                    params.node.setDataValue('FOLGA', FOLGA);
                    return;
                }
            } catch {
                params.node.setDataValue('PADRAO_ALTERADO', 1);
                params.node.setDataValue('FOLGA', FOLGA);
                return;
            }
            params.node.setDataValue('PADRAO_ALTERADO', 1);
            params.node.setDataValue('FOLGA', FOLGA);
            return;
        }
        else if (clickedColumn === 'GARAGEM') {
            if (clickedValue > '09:40') { params.node.setDataValue('TURNO', 2); }
            else { params.node.setDataValue('TURNO', 1); }
        }
    },

    folgaRendererMensal: class folgaRendererMensal {
        private eGui!: any;
        init(params: any) {
            const padroes = runtimeArgs.padroes;

            let folga: string[] = params.value || [];
            const defaultFolgaStr: string = padroes[params.data.PADRAO_FOLGA] || '';
            let defaultFolga: string[]

            defaultFolga = defaultFolgaStr.split(", ").map(f => f.trim());

            let defaultValues = folga.filter(f => defaultFolga.includes(f));
            let extraValues = folga.filter(f => !defaultFolga.includes(f));

            this.eGui = document.createElement('span');

            if (extraValues.length > 0) {
                extraValues.forEach((value: any, index: any) => {
                    let span = document.createElement('span');
                    span.style.color = 'deepskyblue';
                    span.innerText = value;

                    this.eGui.appendChild(span);

                    if (index < extraValues.length - 1) {
                        let separator = document.createTextNode(", ");
                        this.eGui.appendChild(separator);
                    }
                });
                if (defaultValues.length > 0) {
                    let separator = document.createTextNode(", ");
                    this.eGui.appendChild(separator);
                }
            }
            let formattedDefault = defaultValues.join(", ");
            if (formattedDefault) {
                let defaultSpan = document.createElement('span');
                if (defaultValues.length < defaultFolga.length) { defaultSpan.style.color = 'darksalmon'; }
                defaultSpan.innerText = formattedDefault;
                this.eGui.appendChild(defaultSpan);
            }
        }
        getGui() {
            return this.eGui;
        }
    },
    
    anuladoHighlight(params: any) {
        const motivos = ['Redução de frota', 'Falta de carro', 'Falta de motorista'];
        if (params.data.ANULADO != 999) {
            return `Corte: ${motivos[params.data.ANULADO]}`;
        }
        if ((params.data.ESCALADO !== 'nein')) {
            return `Já escalado: ${params.data.ESCALADO}`;
        }
        if (params.data.IMPEDIDO) {
            return `Motorista com ocorrência`;
        }
    },

    anuladoHighlightRealtime(params: any) {
        const motivos = ['Redução de frota', 'Falta de carro', 'Falta de motorista'];
        if (params.data.ANULADO != 999) {
            return `Horário cortado: ${motivos[params.data.ANULADO]}`;
        }
        if ((params.data.ESCALADO !== 'nein' && !params.data.REALIZADO)) {
            return `Motorista em outro horário: ${params.data.ESCALADO}`;
        }
        if (params.data.IMPEDIDO) {
            return `Motorista com ocorrência`;
        }
        if ((
            (params.data.ID.includes('TU') && params.data.SEQ_GUIA > 2) ||
            (!params.data.ID.includes('TU') && params.data.SEQ_GUIA > 1)
        ) && params.data.SEQ_GUIA != 999 && params.data.TROCOU_CARRO == 1) {
            return `Motorista trocou de carro`;
        }
        if ((params.data.TROCOU_CARRO == 1) && (params.data.TROCA_CARRO != 9)) {
            return `Troca de motorista`;
        }
    },

    vinculoDetail: class MyDetailCellRenderer {
        private eGui!: any;

        init(params: any) {
            if (params.data.MATRICULA_DESVINCULO) {
                const cookies = document.cookie.split('; ');
                let token = '';

                for (const cookie of cookies) {
                    const [key, value] = cookie.split('=');
                    if (key === 'gpc_data') {token = value;}
                }

                this.eGui = document.createElement('iframe') as HTMLIFrameElement;
                this.eGui.style.width = '100%';
                this.eGui.style.paddingLeft = '.5rem';
                this.eGui.style.height = '840px';
                this.eGui.src = `https://gpcapi.rdrgs.com.br/filipeta?token=${encodeURIComponent(token)}&id=${params.data.ID_UNICO}`;
            }
            else {
                this.eGui = document.createElement('div');
                this.eGui.innerHTML = '<h3>Serviço ainda não encerrado</h3>'
            }

        }

        getGui() {
            return this.eGui;
        }

        refresh() {
            return false;
        }
    },

    vinculoPrestadoDetail: class MyDetailCellRenderer {
        private eGui!: any;

        init(params: any) {
            if (params.data.MATRICULA_DESVINCULO) {
                const cookies = document.cookie.split('; ');
                let token = '';

                for (const cookie of cookies) {
                    const [key, value] = cookie.split('=');
                    if (key === 'gpc_data') {token = value;}
                }
                this.eGui = document.createElement('iframe');
                this.eGui.style.width = '100%';
                this.eGui.style.border = 'none';
                this.eGui.style.height = '840px';
                this.eGui.src = `https://gpcapi.rdrgs.com.br/total_prestacao?token=${encodeURIComponent(token)}&id=${params.data.ID_UNICO}&matricula_gerou=${params.data.MATRICULA_GEROU}&dia_gerou=${params.data.DATA_GEROU}`;
            }
            else {
                this.eGui = document.createElement('div');
                this.eGui.innerHTML = '<h3>Serviço ainda não encerrado</h3>'
            }
        }

        getGui() {
            return this.eGui;
        }

        refresh() {
            return false;
        }
    },
    realtimeDetail: class MyDetailCellRenderer {
        private eGui!: any;
        init(params: any) {
            this.eGui = document.createElement('div');
            this.eGui.style.overflowX = "auto";
            const diff_calc = ((start: any, end: any) => {
                if (!start || !end) return "--:--";
                const a = start.split(":").reduce((h: any,m: any) => h*60 + +m, 0);
                const b = end.split(":").reduce((h: any,m: any) => h*60 + +m, 0);
                const d = b - a;
                const sign = d < 0 ? "-" : "";
                const h = Math.floor(Math.abs(d) / 60);
                const m = Math.abs(d) % 60;
                return `${sign}${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
            });

            const garage = params.data.REALIZADO ? params.data.GARAGEM : '';
            const ponto = params.data.REALIZADO ? params.data.PONTO : '';
            const motorista = (params.data.REALIZADO && !params.data.INCOMPLETO_MOTORISTA) ? params.data.MOTORISTA : '';
            const carro = (params.data.REALIZADO && !params.data.INCOMPLETO_CARRO) ? params.data.CARRO : '';

            const diff_garage = diff_calc(params.data.GARAGEM_PREVISTO, garage);
            const diff_ponto = diff_calc(params.data.PONTO_PREVISTO, ponto);
            this.eGui.innerHTML = `
    <table class="telala"><tbody>
    <tr><td style="visibility: hidden"></td><td class="headerer">Carro</td><td class="headerer">Motorista</td><td class="headerer">Garagem</td><td class="headerer">Ponto</td>
    </tr>
    <tr><td class="headerer">Previsto</td><td>${params.data.CARRO_PREVISTO || ''}</td><td>${params.data.MOTORISTA_PREVISTO || ''}</td><td>${params.data.GARAGEM_PREVISTO || ''}</td><td>${params.data.PONTO_PREVISTO || ''}</td>
    </tr>
    <tr><td class="headerer">Realizado</td><td>${carro}</td><td>${motorista}</td><td>${garage}</td><td>${ponto}</td>
    </tr>
    <tr><td style="visibility: hidden"></td><td style="visibility: hidden"></td><td>Diferença:</td><td>${diff_garage}</td><td>${diff_ponto}</td>
    </tr>
    </tbody></table>
    ${params.data.MATRICULA_AJUSTOU ? '<p style="font-weight: 400">Ajustado por: <strong>' + params.data.MATRICULA_AJUSTOU + '</strong></p>' : ''}
    ${params.data.MOTIVO_MOTORISTA !== 'nein' ? '<p style="font-weight: 400">Motivo da troca de motorista: <span style="color: red; font-weight: 700">' + params.data.MOTIVO_MOTORISTA + '</span></p>' : ''}
    ${params.data.MOTIVO_CARRO !== 'nein' ? '<p style="font-weight: 400">Motivo da troca de carro: <span style="color: red; font-weight: 700">' + params.data.MOTIVO_CARRO + '</span></p>' : ''}
    ${params.data.MOTIVO_HORARIO !== 'nein' ? '<p style="font-weight: 400">Motivo da troca de horário: <span style="color: red; font-weight: 700">' + params.data.MOTIVO_HORARIO + '</span></p>' : ''}
    `;
        }

        getGui() {
            return this.eGui;
        }

        refresh() {
            return false;
        }
    },

    hourParser(params: any){let input=params.newValue;if(input.includes(':')){const time=input.split(':');const hours=Math.min(30,Math.max(0,parseInt(time[0]||0)));const minutes=Math.min(59,Math.max(0,parseInt(time[1]||0)));return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`}if(/^\d{3,4}$/.test(input)){const hours=Math.min(30,Math.max(0,parseInt(input.slice(0,-2))));const minutes=Math.min(59,Math.max(0,parseInt(input.slice(-2))));return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`}return params.value},

    carroParser(params: any){if(!(/^-?\d+$/.test(params.newValue))){return "";}if(params.node.data.EMPRESA=="001"){if(params.newValue.length<6){return params.newValue.padStart(6,"190000")}}else if(params.node.data.EMPRESA=="002"){if(params.newValue.length<4){return params.newValue.padStart(4,"6000")}}else if(params.node.data.EMPRESA=="003"){if(params.newValue.length<5){return params.newValue.padStart(5,"21000")}}return params.newValue},

    turnoParser(params: any) {
        const value = Number(params.newValue ?? params.value);
        if (value === 1 || value === 2) {
            return value;
        } else {
            return params.data.GARAGEM > '09:40' ? 2 : 1;
        }
    },

    seqCarro(params: any){if(params.data.SEQ_CARRO==999){return'EXTRA'}else if(params.data.SEQ_CARRO==888){return'TROCA'}else{return `${params.data.SEQ_CARRO}º`}},

    seqGuiaRealtime(params: any) {
        if (params.data.MOTORISTA) {
            const matricula = params.data.MOTORISTA;
            if (params.data.SEQ_GUIA == 999) { return matricula; }
            let seq_guia: number
            if (params.data.SEQ_GUIA) {
                seq_guia = params.data.SEQ_GUIA;
            } else {
                seq_guia = 1;
            }
            if (seq_guia > 1) {
                return `${matricula} (${seq_guia}ª Guia)`;
            } else { return matricula; }
        }
        else { return ''; }
    },

    seqGuia(params: any) {
        if (params.data.MATRICULA) {
            if (params.data.SEQ_GUIA == 999) { return `${params.data.MATRICULA}`; }
            let seq_guia: number
            if (params.data.SEQ_GUIA) {
                seq_guia = params.data.SEQ_GUIA;
            } else {
                seq_guia = 1;
            }
            if (seq_guia > 1) {
                return `${params.data.MATRICULA} (${seq_guia}ª Guia)`;
            } else { return params.data.MOTORISTA; }
        }
        else { return ''; }
    },
    consultaGuiaRender(params: any) {
        const api = params.api;

        api.addEventListener('cellKeyDown', (e:any) => {
            const key = e.event.key;
            if (key === 'ArrowDown' || key === 'ArrowUp') {
                e.event.preventDefault();

                const selectedNode = api.getSelectedNodes()[0];
                if (!selectedNode) return;

                const allNodes = api.getRenderedNodes();

                const currentIndex = allNodes.indexOf(selectedNode);
                const nextIndex = key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

                const nextNode = allNodes[nextIndex];
                if (nextNode) {
                    nextNode.setSelected(true);
                    api.ensureIndexVisible(nextNode.rowIndex);
                }
            }
        });
    },

    motoristaRowColorRealtime_light(params:any) {
        if (params.data.ANULADO != 999) {
            return {
                backgroundColor: '#FC656599',
                color: '#601',
                fontWeight: 'bold'
            };
        }
        if (params.data.REALIZADO) {
            return {
                backgroundColor: '#65FC6070',
                color: '#061',
                fontWeight: 'bold'
            };
        }
        return null
    },

    motoristaRowColorRealtime_dark(params: any) {
        if (params.data.ANULADO != 999) {
            return {
                backgroundColor: '#6019',
                color: '#FFBBBB',
                fontWeight: 'bold'
            };
        }
        if (params.data.REALIZADO) {
            return {
                backgroundColor: '#2704',
                color: '#AEFFAE',
                fontWeight: 'bold'
            };
        }
        return null
    },

    motoristaRowColorGuia_light(params: any) {
        if (params.data.ANULADO != 999) {
            return {
                backgroundColor: '#FC656599',
                color: '#601',
                fontWeight: 'bold'
            };
        }
        if (params.data.IMPEDIDO || (params.data.ESCALADO !== 'nein')) {
            return {
                backgroundColor: '#FCFC6599',
                color: '#660',
                fontWeight: 'bold'
            };
        }

        return null
    },

    motoristaRowColorGuia_dark(params: any) {
        if (params.data.ANULADO != 999) {
            return {
                backgroundColor: '#6019',
                color: '#FFBBBB',
                fontWeight: 'bold'
            };
        }

        if (params.data.IMPEDIDO || (params.data.ESCALADO !== 'nein')) {
            return {
                backgroundColor: '#6609',
                color: '#FFFFB9',
                fontWeight: 'bold'
            };
        }

        return null
    },

    motoristaColorRealtime_light(params: any) {
        if (params.data.IMPEDIDO || (params.data.ESCALADO !== 'nein' && !params.data.REALIZADO)) {
            return {
                backgroundColor: '#FC656599',
                color: '#601',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        if (params.data.INCOMPLETO_MOTORISTA) {
            return {
                backgroundColor: '#FCFC65',
                color: '#601',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        if (params.data.MOTORISTA_DIFF) {
            return {
                backgroundColor: null,
                color: 'red',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        return {
            backgroundColor: null,
            color: null,
            fontWeight: null,
            textAlign: 'center'
        };
    },

    motoristaColorRealtime_dark(params: any) {
        if (params.data.IMPEDIDO || (params.data.ESCALADO !== 'nein' && !params.data.REALIZADO)) {
            return {
                backgroundColor: '#6019',
                color: '#FFBBBB',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        if (params.data.INCOMPLETO_MOTORISTA) {
            return {
                backgroundColor: '#6119',
                color: '#FCFC65',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        if (params.data.MOTORISTA_DIFF) {
            return {
                backgroundColor: null,
                color: 'red',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        return {
            backgroundColor: null,
            color: null,
            fontWeight: null,
            textAlign: 'center'
        };
    },

    carroColorRealtime_light(params: any) {
        if (params.data.INCOMPLETO_CARRO) {
            return {
                backgroundColor: '#FCFC65',
                color: '#601',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        if (params.data.CARRO_DIFF) {
            return {
                backgroundColor: null,
                color: 'red',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        return {
            backgroundColor: null,
            color: null,
            fontWeight: null,
            textAlign: 'center'
        };
    },

    carroColorRealtime_dark(params: any) {
        if (params.data.INCOMPLETO_CARRO) {
            return {
                backgroundColor: '#6119',
                color: '#FCFC65',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        if (params.data.CARRO_DIFF) {
            return {
                backgroundColor: null,
                color: 'red',
                fontWeight: 'bold',
                textAlign: 'center'
            };
        }
        return {
            backgroundColor: null,
            color: null,
            fontWeight: null,
            textAlign: 'center'
        };
    },

    motivoColorRealtime_light(params: any) {
        if (params.data.IMPEDIDO || (params.data.ESCALADO !== 'nein' && !params.data.REALIZADO)) {
            return {
                backgroundColor: '#FC656599',
                fontWeight: 'bold',
                color: '#601',
                textAlign: 'start'
            };
        }
        return null
    },

    motivoColorRealtime_dark(params: any) {
        if (params.data.IMPEDIDO || (params.data.ESCALADO !== 'nein' && !params.data.REALIZADO)) {
            return {
                backgroundColor: '#6019',
                fontWeight: 'bold',
                color: '#FFBBBB',
                textAlign: 'start'
            };
        }
        return null
    },

    qdIdFormatter(params: any) {
        const fr = Object.values(params.node.allLeafChildren[0]?.data);
        const lr = Object.values(params.node.allLeafChildren[params.node.allLeafChildren.length - 1]?.data);
        return `Tabela ${fr[0]} - ${fr[6]}  à  ${lr[7]}`;
    },

    rtGaragem(params: any){if(params.data.GARAGE_DIFF){return{color:'red',fontWeight:'bold'}}return null},
    rtPonto(params: any){if(params.data.PONTO_DIFF){return{color:'red',fontWeight:'bold'}}return null},
    qtdFormatterGuiasEscaneadas(params: any){if(params.data.count>0){return `${params.data.count} a mais`}else if(params.data.count<0){return `${Math.abs(params.data.count)} faltando`}return'Quantidade OK'},

    rowColorViagem_light(p: any){if(p.data.DUPLICADO){return{color:'#601',backgroundColor:'#FCFC65'}}return null},
    rowColorViagem_dark(p: any){if(p.data.DUPLICADO){return{color:'#FFBBBB',backgroundColor:'#6019'}}return null},
    shortDateFormatter(p: any){try {return format(parseISO(p.value), "dd/MM/yyyy")} catch {return p.value}},
    dateTimeFormatter(p: any){try {return format(parseISO(p.value), "dd/MM/yyyy HH:mm")} catch {return p.value}},

    nameFormatter(p: any) {const ddfc=runtimeArgs.ddfc_list;if(p.value in ddfc){return `${p.value} - ${ddfc[p.value]}`}},

    tipoPontoFormatter(p: any) {return ['Início de Jornada', 'Início do Intervalo', 'Fim do Intervalo', 'Fim de Jornada'][p.value]},
    latLonFormatter(p: any) {return `${p.data.LATITUDE}, ${p.data.LONGITUDE}`}
};



function parseJsCodeFromPython(v: string) {
    if (v in funcs) {return (funcs as any)[v] as (params: any) => number;}
    const JS_PLACEHOLDER = "::JSCODE::"
    const funcReg = new RegExp(`${JS_PLACEHOLDER}(.*?)${JS_PLACEHOLDER}`, "s")
    let match = funcReg.exec(v)
    if (match) {
        const funcStr = match[1]
        // eslint-disable-next-line
        return new Function("return " + funcStr)()
    } else {
        return v
    }
}


class AgGrid extends React.Component<ComponentProps, State> {
  public state: State

  private readonly gridContainerRef: React.RefObject<HTMLDivElement>
  private readonly isGridAutoHeightOn: boolean
  private renderedGridHeightPrevious: number = 0

  constructor(props: ComponentProps) {
    super(props)
    this.gridContainerRef = React.createRef()

      addCustomCSS((props.args.mode === 'dark' ? ':where(.ag-theme-params-1){--ag-background-color:#0d1217!important}' : '') + (props.args.custom_css || ''))

    const enableEnterpriseModules = props.args.enable_enterprise_modules
    if (enableEnterpriseModules === true) {
        ModuleRegistry.registerModules([AllEnterpriseModule])
      if ("license_key" in props.args) {
          LicenseManager.setLicenseKey(props.args["license_key"])
      }
    } else {
      ModuleRegistry.registerModules([AllCommunityModule])
    }


    this.isGridAutoHeightOn = this.props.args.gridOptions?.domLayout === "autoHeight"

      runtimeArgs.ddfc = props.args.ddfc
      runtimeArgs.padroes = props.args.padroes
      runtimeArgs.empresa = props.args.empresa
      runtimeArgs.linhas_permitidas = props.args.linhas_permitidas
      runtimeArgs.nome_linhas = props.args.nome_linhas
      runtimeArgs.imp = props.args.imp
      runtimeArgs.retira_folga = props.args.retira_folga
      runtimeArgs.dict_escala_mensal = props.args.dict_escala_mensal
      runtimeArgs.ddfc_list = props.args.ddfc_list


    const go = this.parseGridoptions()

    const StreamlitAgGridPro = (window as any)?.StreamlitAgGridPro
    if (StreamlitAgGridPro) {
      StreamlitAgGridPro.returnGridValue = this.returnGridValue.bind(this)

      if (StreamlitAgGridPro.extenders && Array.isArray(StreamlitAgGridPro.extenders)) {
        StreamlitAgGridPro.extenders.forEach((extender: (go: any) => void) => {
          if (typeof extender === "function") {
            extender(go)
          }
        })
      }
    }

    this.state = {
      gridHeight: this.props.args.height,
      gridOptions: go,
      isRowDataEdited: false,
      api: undefined,
      enterprise_features_enabled: props.args.enable_enterprise_modules,
    } as State
  }

  private parseGridoptions() {
    let gridOptions: GridOptions = cloneDeep(this.props.args.gridOptions)

    gridOptions = deepMap(gridOptions, parseJsCodeFromPython, ["rowData"])

    //Sets getRowID if data came from a pandas dataframe like object. (has __pandas_index)
    if (every(gridOptions.rowData, (o) => "__pandas_index" in o)) {
      if (!("getRowId" in gridOptions)) {
        gridOptions["getRowId"] = (params: GetRowIdParams) =>
          params.data.__pandas_index as string
      }
    }

    if (!("getRowId" in gridOptions)) {
      console.warn("getRowId was not set. Grid may behave bad when updating.")
    }

    //processTheming
    gridOptions.theme = parseTheme(this.props.args.theme, this.props.args.mode)

    return gridOptions
  }

  private attachStreamlitRerunToEvents(api: GridApi) {
    const updateEvents = this.props.args.update_on;

    updateEvents.forEach((element: any) => {
        if (Array.isArray(element)) {
            // If element is a tuple (eventName, timeout), apply debounce for the timeout duration
            const [eventName, timeout] = element;
            api.addEventListener(
                eventName,
                debounce(
                    (e: any) => {
                        this.returnGridValue(e, eventName);
                    },
                    timeout,
                    {
                        leading: false,
                        trailing: true,
                        maxWait: timeout,
                    }
                )
            );
        } else {
            // Attach event listener for non-tuple events
            api.addEventListener(element, (e: any) => {
                this.returnGridValue(e, element);
            });
        }
        console.log(`Attached grid return event: ${element}`);
    });
  }

  private loadColumnsState() {
    const columnsState = this.props.args.columns_state
    if (columnsState != null) {
      this.state.api?.applyColumnState({
        state: columnsState,
        applyOrder: true,
      })
    }
  }

  private resizeGridContainer() {
    const renderedGridHeight = this.gridContainerRef.current?.clientHeight
    if (
      renderedGridHeight &&
      renderedGridHeight > 0 &&
      renderedGridHeight !== this.renderedGridHeightPrevious
    ) {
      this.renderedGridHeightPrevious = renderedGridHeight
      Streamlit.setFrameHeight(renderedGridHeight)
    }
  }

  private async getGridReturnValue(
    e: any,
    streamlitRerunEventTriggerName: string
  ) {
    return getGridReturnValue(
      this.state.api,
      this.state.enterprise_features_enabled,
      this.state.gridOptions,
      this.props,
      e,
      streamlitRerunEventTriggerName
    )
  }

  private returnGridValue(e: any, streamlitRerunEventTriggerName: string) {
    this.getGridReturnValue(e, streamlitRerunEventTriggerName).then((v) =>
      Streamlit.setComponentValue(v)
    )
  }

  private defineContainerHeight() {
    if (this.isGridAutoHeightOn) {
      return {
        width: this.props.width,
      }
    } else {
      return {
        width: this.props.width,
        height: this.props.args.height,
      }
    }
  }

  public componentDidUpdate(prevProps: any) {
    const prevGridOptions = prevProps.args.gridOptions
    const currGridOptions = this.props.args.gridOptions

    //Theme object Changes here
    if (
      !isEqual(prevProps.theme, this.props.theme) ||
      !isEqual(this.props.args.theme, prevProps.args.theme)
    ) {
      let agGridTheme = this.props.args.theme

      this.state.api?.updateGridOptions({
        theme: parseTheme(agGridTheme, this.props.args.mode),
      })
    }

    //const objectDiff = (a: any, b: any) => fromPairs(differenceWith(toPairs(a), toPairs(b), isEqual))
    if (!isEqual(prevGridOptions, currGridOptions)) {
      let go = this.parseGridoptions()
      let row_data = go.rowData

      if (!this.state.isRowDataEdited) {
        this.state.api?.updateGridOptions({ rowData: row_data })
      }

      delete go.rowData
      this.state.api?.updateGridOptions(go)
    }

    if (
      !isEqual(prevProps.args.columns_state, this.props.args.columns_state)
    ) {
      this.loadColumnsState()
    }
  }

  private onGridReady(event: GridReadyEvent) {
    this.setState({ api: event.api })

    //Is it ugly? Yes. Does it work? Yes. Why? IDK
    // eslint-disable-next-line
    this.state.api = event.api

    this.state.api?.addEventListener("rowGroupOpened", () =>
      this.resizeGridContainer()
    )

    this.state.api?.addEventListener("firstDataRendered", () => {
      this.resizeGridContainer()
    })

    this.state.api.addEventListener(
      "gridSizeChanged",
      () => this.onGridSizeChanged()
    )
    this.state.api.addEventListener(
      "cellValueChanged",
      () => this.cellValueChanged()
    )

    //Attach events
    this.attachStreamlitRerunToEvents(this.state.api)

    if (this.state.enterprise_features_enabled) {
      this.state.api?.forEachDetailGridInfo((i: DetailGridInfo) => {
        if (i.api !== undefined) {
          this.attachStreamlitRerunToEvents(i.api)
        }
      })
    }

    //If there is any event onGridReady in gridOptions, fire it
    let { onGridReady } = this.state.gridOptions
    onGridReady && onGridReady(event)
  }

  private onGridSizeChanged() {
    this.resizeGridContainer()
  }

  private cellValueChanged() {
    this.setState({ isRowDataEdited: true })
  }

  public render = (): ReactNode => {
    return (
      <div
        id="gridContainer"
        ref={this.gridContainerRef}
        style={this.defineContainerHeight()}
      >
        <GridToolBar
          showManualUpdateButton={this.props.args.manual_update === true}
          enabled={this.props.args.show_toolbar ?? true}
          showSearch={this.props.args.show_search ?? true}
          showDownloadButton={this.props.args.show_download_button ?? true}
          onQuickSearchChange={(value) => {
        this.state.api?.setGridOption("quickFilterText", value);
        this.state.api?.hideOverlay(); // Hide any overlay if present
          }}
          onDownloadClick={() => {
        this.state.api?.exportDataAsCsv();
          }}
        />
        <AgGridReact
          onGridReady={(e: GridReadyEvent<any, any>) => this.onGridReady(e)}
          gridOptions={this.state.gridOptions}
          localeText={AG_GRID_LOCALE_BR}
        ></AgGridReact>
      </div>
    )
  }
}

export default withStreamlitConnection(AgGrid)