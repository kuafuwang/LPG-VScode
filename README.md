[![](https://vsmarketplacebadge.apphb.com/version-short/kuafuwang.lpg-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=kuafuwang.lpg-vscode)


# LPG-VScode README

# lpg-vscode
**The** extension for LPG support in Visual Studio code.
## Features


### Syntax Coloring

* Syntax coloring for LPG grammars (.lpg .g and .gi files)
>![Syntax Coloring](https://raw.githubusercontent.com/kuafuwang/LPG-VScode/master/doc/img/hover.png)

* Comes with an own beautiful color theme, which not only includes all the [recommended groups](http://manual.macromates.com/en/language_grammars), but also some special rules for grammar elements that you won't find in other themes (e.g. alt labels and options). They are, immodestly, named `Complete Dark` and `Complete Light`.

### Code Completion + Symbol Information

* Code suggestions for all rule + optioins ,  etc. (including built-in ones).
* Symbol type + location are shown on mouse hover. Navigate to any symbol with Ctrl/Cmd + Click. This works even for nested grammars.
>![completion](https://raw.githubusercontent.com/kuafuwang/LPG-VScode/master/doc/img/completion.png)


### Grammar Validations

* In the background syntax checking takes place, while typing. Also some semantic checks are done.
>![](https://raw.githubusercontent.com/kuafuwang/LPG-VScode/master/doc/img/dianosic.png)


### Doc formatting

### Graphical-visualizations

* Call graph for LPG grammars 
>![Syntax Coloring]( https://raw.githubusercontent.com/kuafuwang/LPG-VScode/master/doc/img/call_graph.png )

* Terminal and non-terminal  railroad graph for LPG grammars 
>![Syntax Coloring]( https://raw.githubusercontent.com/kuafuwang/LPG-VScode/master/doc/img/railroad.png )

* First set and follow set for LPG grammars 
  
### Parser-generation


### More Informations
There are a number of documentation files for specific topics:


* [Extension Settings](https://github.com/kuafuwang/LPG-VScode/doc/extension-settings.md)



### Miscellaneous

* It's the first version.


## Known Issues

See the [Git issue tracker](https://github.com/kuafuwang/LPG-VScode/issues).

## What's planned next?

Bug fixing and what feels appealing to hack on.

## Release Notes

Note: there are sometimes holes between release numbers, which are caused by the need of re-releasing a version due to release problems. The do not change anything in the extension code.


### 0.0.5

* Support action list after a rule.
* Fixed lpg generator bugs.
  
### 0.0.4

* fixed lpg language server bugs.
  
### 0.0.3

* fixed lpg generator bugs.
  
### 0.0.2

* full setup of the project
* added most of the required settings etc.
* included dark theme is complete