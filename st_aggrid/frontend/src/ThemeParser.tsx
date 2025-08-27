import { themeQuartz,
    themeAlpine, 
    themeBalham, 
    Theme, 
    colorSchemeLight, 
    colorSchemeLightWarm, 
    colorSchemeLightCold,
    colorSchemeDark,
    colorSchemeDarkWarm,  
    colorSchemeDarkBlue,
    iconSetQuartz,
    iconSetQuartzLight,
    iconSetQuartzBold,
    iconSetAlpine,
    iconSetMaterial,
    iconSetQuartzRegular,
    Part,
} from 'ag-grid-community';

type stAggridThemeOptions = {
    themeName: string,
    base: string,
    params: [key: string]
    parts: string[],
}

const baseMapper: Record<string, Theme> = {
    quartz: themeQuartz,
    alpine: themeAlpine,
    balham: themeBalham
};

const partsMapper: Record<string, Part> = {
    colorSchemeLight,
    colorSchemeLightWarm,
    colorSchemeLightCold,
    colorSchemeDark,
    colorSchemeDarkWarm,
    colorSchemeDarkBlue,
    iconSetQuartz: iconSetQuartz(undefined),
    iconSetQuartzLight,
    iconSetQuartzBold,
    iconSetAlpine,
    iconSetMaterial,
    iconSetQuartzRegular
};

function applyParts(theme: Theme, partNames?: string[]): Theme {
    if (!partNames || partNames.length === 0) return theme;
    return partNames.reduce(
        (acc, partName) => acc.withPart(partsMapper[partName]),
        theme
    );
}

function applyParams(theme: Theme, params?: Record<string, any>): Theme {
    return params && Object.keys(params).length ? theme.withParams(params) : theme;
}

function parseTheme(gridOptionsTheme: stAggridThemeOptions, mode: string): Theme {
    const { themeName, base, params, parts } = gridOptionsTheme;


    switch (themeName) {
        case 'alpine':
            return themeAlpine;
        case 'balham':
            return themeBalham;
        case 'material':
            return themeAlpine.withPart(iconSetMaterial);
        case 'custom':
            let theme = baseMapper[base]
            theme = applyParams(theme, params);
            if (mode === 'dark') {parts.push('colorSchemeDark')}
            theme = applyParts(theme, parts);
            return theme;
        default:
            return themeBalham;
    }
}

export {parseTheme}
