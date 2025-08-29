import {
    themeBalham,
    Theme,
    colorSchemeDark,
    iconSetQuartz,
    iconSetQuartzLight,
    iconSetQuartzBold,
    iconSetAlpine,
    iconSetMaterial,
    iconSetQuartzRegular,
    Part,
} from 'ag-grid-community';

type stAggridThemeOptions = {
    params: [key: string]
    parts: string[],
}

const partsMapper: Record<string, Part> = {
    colorSchemeDark,
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
    const { params, parts } = gridOptionsTheme;
    let theme = themeBalham
    theme = applyParams(theme, params);
    if (mode === 'dark') {parts.push('colorSchemeDark')}
    theme = applyParts(theme, parts);
    return theme;
}

export {parseTheme}
