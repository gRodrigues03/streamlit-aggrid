export function addCustomCSS(custom_css: string): void {
  const style = document.createElement("style");
  style.textContent = custom_css
  document.head.appendChild(style)
}



const funcs = {
    anuladoHighlight(params: any) {
        const motivos = ['Redução de frota', 'Falta de carro', 'Falta de motorista'];
        if (params.data.ANULADO != 999) {
            return `Corte: ${motivos[params.data.ANULADO]}`;
        }
        if ((params.data.ESCALADO != 'nein')) {
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
        if ((params.data.ESCALADO != 'nein' && !params.data.REALIZADO)) {
            return `Motorista em outro horário: ${params.data.ESCALADO}`;
        }
        if (params.data.IMPEDIDO) {
            return `Motorista com ocorrência`;
        }
        if ((
            (params.data.ID.includes('TU') && params.data.SEQ_GUIA > 2) ||
            (!params.data.ID.includes('TU') && params.data.SEQ_GUIA > 1)
        ) && params.data.SEQ_GUIA != 999) {
            return `Motorista trocou de carro`;
        }
        if ((params.data.TROCA_CARRO > 1) && (params.data.TROCA_CARRO != 9)) {
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

        refresh(params: any) {
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

    refresh(params: any) {
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
        const desp = ((params.data.MATRICULA_AJUSTOU != 0) && params.data.MATRICULA_AJUSTOU) ? params.data.MATRICULA_AJUSTOU : '';
        console.log(desp);

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
    ${params.data.MOTIVO_MOTORISTA != 'nein' ? '<p style="font-weight: 400">Motivo da troca de motorista: <span style="color: red; font-weight: 700">' + params.data.MOTIVO_MOTORISTA + '</span></p>' : ''}
    ${params.data.MOTIVO_CARRO != 'nein' ? '<p style="font-weight: 400">Motivo da troca de carro: <span style="color: red; font-weight: 700">' + params.data.MOTIVO_CARRO + '</span></p>' : ''}
    ${params.data.MOTIVO_HORARIO != 'nein' ? '<p style="font-weight: 400">Motivo da troca de horário: <span style="color: red; font-weight: 700">' + params.data.MOTIVO_HORARIO + '</span></p>' : ''}
    `;
    }

    getGui() {
        return this.eGui;
    }

    refresh(params: any) {
        return false;
    }
},

    hourParser(params: any){let input=params.newValue;if(input.includes(':')){const time=input.split(':');const hours=Math.min(30,Math.max(0,parseInt(time[0]||0)));const minutes=Math.min(59,Math.max(0,parseInt(time[1]||0)));return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`}if(/^\d{3,4}$/.test(input)){const hours=Math.min(30,Math.max(0,parseInt(input.slice(0,-2))));const minutes=Math.min(59,Math.max(0,parseInt(input.slice(-2))));return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`}return params.value},

    carroParser(params: any){if(!(/^-?\d+$/.test(params.newValue))){return "";}if(params.node.data.EMPRESA=="001"){if(params.newValue.length<6){return params.newValue.padStart(6,"190000")}}else if(params.node.data.EMPRESA=="002"){if(params.newValue.length<4){return params.newValue.padStart(4,"6000")}}else if(params.node.data.EMPRESA=="003"){if(params.newValue.length<5){return params.newValue.padStart(5,"21000")}}return params.newValue},

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
    }
};



export function parseJsCodeFromPython(v: string) {
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
