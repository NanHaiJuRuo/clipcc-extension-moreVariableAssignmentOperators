const catId= 'nhjr.more_var_assignment_operators';
const {api, type, Extension}= require('clipcc-extension');
const tBT= type.BlockType;
const tPT= type.ParameterType;
const VM= api.getVmInstance();
const AssignmentOperators= ['=','+=','-=','*=','/=','%='];
const inTypeMenu_list= ['','Number','String','ScratchBoolean'];
/*var variable_NaN_fix_mode= true;*/

module.exports= class E extends Extension {
    VarMenu_getSpriteVars(target,TYPE,in_vars){
        var export_vars = in_vars;
        var Vars = target.variables
        for (const varId in Vars){
            if (!Vars.hasOwnProperty(varId)) continue;
            const variable= Vars[varId];
            if (variable.type!=TYPE) continue;
            export_vars[variable.name]= varId
        }
        return export_vars
    }
    VarMenu(TYPE){
        var MENU= this.VarMenu_getSpriteVars(VM.editingTarget,TYPE,{});
        if(!VM.editingTarget.isStage) MENU= this.VarMenu_getSpriteVars(VM.runtime.targets[0],TYPE,MENU);
        var export_menu= Object.entries(MENU);
        if(export_menu.length<1) export_menu= [['','']];
        return export_menu
    }

    makeMenus(block,menus){
        const menu = [];
        for (const item of menus) {
            menu.push({
                messageId: `${block}.menu.${item}`,
                value: item
            });
        }
        return menu;
    }
    AssignmentOperatorsMenu(){
        return this.makeMenus(catId,AssignmentOperators)
    }
    inTypeMenu(){
        return this.makeMenus(catId,inTypeMenu_list)
    }

    ScratchBoolean(value){/* 改自clipcc-vm/src/util/cast.js */
        if (typeof value === 'string') {
            if ((value === '') ||
                (value === '0') ||
                (value.toLowerCase() === 'false')) {
                return false;
            }
            return true;
        }
        return Boolean(value);
    }

    setValueFixNaN(IN_VAR,OPERATOR,IN_TYPE,VALUE){
        const ScratchBoolean= this.ScratchBoolean;
        var VAR= IN_VAR;
        eval(`VAR${OPERATOR+IN_TYPE}(VALUE)`);
        if(/*variable_NaN_fix_mode &&*/ typeof(VAR)=='number' && !Number.isFinite(VAR)){
            VAR +='' /*转为字符串*/
        }
        return VAR
    }
    setVar(util,ID,OPERATOR,IN_TYPE,VALUE){
        /* ↓ 此处已有运算符合规检测，可以不在源头检测。*/
        if (!AssignmentOperators.includes(OPERATOR) || !inTypeMenu_list.includes(IN_TYPE)) return;

        var variables=util.target.variables;
        if(!variables.hasOwnProperty(ID)){
            variables= VM.runtime.targets[0].variables
        }
        if(!variables.hasOwnProperty(ID) || variables[ID].type!='') return;

        /*if(variable_NaN_fix_mode)*/ variables[ID].value = this.setValueFixNaN(variables[ID].value, OPERATOR,IN_TYPE,VALUE)
        /*else{
            const ScratchBoolean= this.ScratchBoolean;
            eval(`variables[ID].value${OPERATOR+IN_TYPE}(VALUE)`)
        }*/
    }
    setList(util,ID,IN_ITEM,OPERATOR,IN_TYPE,VALUE){
        /* ↓ 此处已有运算符合规检测，可以不在源头检测。*/
        if (!AssignmentOperators.includes(OPERATOR) || !inTypeMenu_list.includes(IN_TYPE)) return;

        var target=util.target
        var variables=target.variables;
        if(!variables.hasOwnProperty(ID)){
            target=VM.runtime.targets[0];
            variables=target.variables;
        }
        if(!variables.hasOwnProperty(ID) || variables[ID].type!='list') return;

        var Variable= variables[ID];
        var Length= Variable.value.length;
        if(IN_ITEM=='last') var item= Length-1
        else if(IN_ITEM=='random') var item= Math.round(Math.random()*(Length-1))
        else{
            var num= Number(IN_ITEM);
            if(num===NaN) return;
            num= Math.round(num);
            if(0<num<=Length) var item= num-1
            else return;
        }

        /*if(variable_NaN_fix_mode)*/ Variable.value[item] = this.setValueFixNaN(Variable.value[item], OPERATOR,IN_TYPE,VALUE)
        /*else{
            const ScratchBoolean= this.ScratchBoolean;
            eval(`Variable.value[item]${OPERATOR+IN_TYPE}(VALUE)`)
        }*/
        Variable._monitorUpToDate = false;
    }


    addBlocks(LIST){
        console.log(LIST);
        for(const i in LIST){
            const [in_opc,in_type,in_Func,in_param]= LIST[i];
            const opc= catId +'.'+ in_opc ;
            api.addBlock({
                opcode: opc,
                type: in_type,
                messageId: opc,
                categoryId: catId,
                param: in_param,
                function: in_Func,
                /* compile: in_Func */
            })
        }
    }
    onInit() {
        api.addCategory({
            categoryId: catId, 
            messageId: catId,
            color: '#ed7600'
        });

        this.addBlocks(
        [
            [
                'setVar',tBT.COMMAND,
                (a,util)=>this.setVar(util,a.VARID,a.OPERATOR,a.IN_TYPE,a.VALUE)
                ,{
                    VARID: {
                        type: tPT.STRING,
                        menu: ()=>this.VarMenu(''),
                        default: '',
                        /*field: true,*/
                    },OPERATOR:{
                        type: tPT.STRING,
                        default: '=',
                        menu: this.AssignmentOperatorsMenu()
                    },IN_TYPE:{
                        type: tPT.STRING,
                        default: '',
                        menu: this.inTypeMenu()
                    },VALUE:{
                        type: tPT.STRING,
                        default: '0',
                    }
                }
            ],[
                'setList',tBT.COMMAND,
                (a,util)=>this.setList(util,a.VARID,a.ITEM,a.OPERATOR,a.IN_TYPE,a.VALUE)
                ,{
                    VARID: {
                        type: tPT.STRING,
                        menu: ()=>this.VarMenu('list'),
                        default: '',
                        /*field: true,*/
                    },ITEM:{
                        type: tPT.NUMBER,
                        default: '1',
                    },OPERATOR:{
                        type: tPT.STRING,
                        default: '=',
                        menu: this.AssignmentOperatorsMenu()
                    },IN_TYPE:{
                        type: tPT.STRING,
                        default: '',
                        menu: this.inTypeMenu()
                    },VALUE:{
                        type: tPT.STRING,
                        default: '0',
                    }
                }
            ]/*,[
                'setVar_NaN_fixMode',tBT.COMMAND,
                a =>{
                    variable_NaN_fix_mode= this.ScratchBoolean(a.VALUE)
                },{
                    VALUE:{
                        type: tPT.STRING,
                        default: 'true',
                        menu: this.makeMenus('nhjr.more_var_assignment_operators.setVar_NaN_fixMode',['true','false'])
                    }
                }
            ],[
                'isVar_NaN_fixMode',tBT.BOOLEAN, ()=> variable_NaN_fix_mode
            ]*/
        ])
    }
    onUninit(){ api.removeCategory(catId) }
}