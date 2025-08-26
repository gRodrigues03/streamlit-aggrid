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

class ThemeParser {
    private baseMapper: Record<string, Theme> = {
        quartz: themeQuartz,
        alpine: themeAlpine,
        balham: themeBalham
    };

    private partsMapper: Record<string, Part> = {
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

    private applyParts(theme: Theme, partNames?: string[]): Theme {
        if (!partNames || partNames.length === 0) return theme;
        return partNames.reduce(
            (acc, partName) => acc.withPart(this.partsMapper[partName]),
            theme
        );
    }

    private applyParams(theme: Theme, params?: Record<string, any>): Theme {
        return params && Object.keys(params).length ? theme.withParams(params) : theme;
    }

    parse(gridOptionsTheme: stAggridThemeOptions): Theme {
        const { themeName, base, params, parts } = gridOptionsTheme;

        switch (themeName) {
            case 'alpine':
                return themeAlpine;
            case 'balham':
                return themeBalham;
            case 'material':
                return themeAlpine.withPart(iconSetMaterial);
            case 'custom':
                let theme = this.baseMapper[base];
                theme = this.applyParams(theme, params);
                theme = this.applyParts(theme, parts);
                return theme;
            default:
                return themeBalham;
        }
    }
}


export {ThemeParser}