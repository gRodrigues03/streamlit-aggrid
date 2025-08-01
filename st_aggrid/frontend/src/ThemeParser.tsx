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
import _ from 'lodash';

type stAggridThemeOptions = {
    themeName: string,
    base: string,
    params: [key: string]
    parts: string[],


}

class ThemeParser {
    private baseMapper : { [key: string] : Theme} = {
        quartz: themeQuartz, 
        alpine: themeAlpine,
        balham: themeBalham
    }

    private partsMapper : { [key: string ] : Part }= {
        colorSchemeLight: colorSchemeLight, 
        colorSchemeLightWarm: colorSchemeLightWarm,
        colorSchemeLightCold: colorSchemeLightCold,
        colorSchemeDark: colorSchemeDark,
        colorSchemeDarkWarm: colorSchemeDarkWarm,
        colorSchemeDarkBlue: colorSchemeDarkBlue,
        iconSetQuartz: iconSetQuartz(undefined),
        iconSetQuartzLight: iconSetQuartzLight,
        iconSetQuartzBold: iconSetQuartzBold,
        iconSetAlpine: iconSetAlpine,
        iconSetMaterial: iconSetMaterial,
        iconSetQuartzRegular: iconSetQuartzRegular
    }

    alpineRecipe() {
        return themeAlpine
    }

    balhamRecipe() {
        return this.baseMapper.themeBalham
    }

    materialRecipe() {
        return themeAlpine.withPart(iconSetMaterial)
    }

    customRecipe(gridOptionsTheme: stAggridThemeOptions) : Theme {
        const {base, params, parts} = gridOptionsTheme

        let theme: Theme = this.baseMapper[base]

        if (! _.isEmpty(params)){
            theme = theme.withParams(params)
        }

        if (! _.isEmpty(parts)){
            theme = parts.reduce((acc, partName) => {const part =  this.partsMapper[partName];  return acc.withPart(part)}, theme)
    
        }
      
        return theme
    }


    parse(gridOptionsTheme: stAggridThemeOptions) : Theme {
        const { themeName } = gridOptionsTheme;

        const recipeMapper: { [key: string]: () => Theme } = {
            alpine: () => this.alpineRecipe(),
            balham: () => this.balhamRecipe(),
            material: () => this.materialRecipe(),
            custom: () => this.customRecipe(gridOptionsTheme)
        };

        const recipe = recipeMapper[themeName] || (() => themeBalham);
        return recipe();
    }
}


export {ThemeParser}