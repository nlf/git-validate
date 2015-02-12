#!/bin/bash

# Copied from github.com/step-/JSON.awk
_json_parser='BEGIN{BRIEF=1;STREAM=1;delete FAILS;while(getline ARGV[++ARGC]<"/dev/stdin"){if(ARGV[ARGC]=="")break}srand();RS="n/o/m/a/t/c/h";rand()}{reset();tokenize($0);if(0==parse()){apply(JPATHS, NJPATHS)}}END{for(name in FAILS){print "invalid: " name;print FAILS[name]}}function apply(ary,size,i){for(i=1;i<size;i++)print ary[i]}function get_token(){TOKEN=TOKENS[++ITOKENS];return ITOKENS<NTOKENS}function parse_array(a1,idx,ary,ret){idx=0;ary="";get_token();if(TOKEN!="]"){while(1){if(ret=parse_value(a1,idx)){return ret}idx=idx+1;ary=ary VALUE;get_token();if(TOKEN=="]"){break}else if(TOKEN==","){ary=ary ","}else{report(",or ]",TOKEN?TOKEN:"EOF");return 2}get_token()}}if(1!=BRIEF){VALUE=sprintf("[%s]",ary)}else{VALUE=""}return 0}function parse_object(a1,key,obj){obj="";get_token();if(TOKEN!="}"){while(1){if(TOKEN~/^".*"$/){key=TOKEN}else{report("string",TOKEN?TOKEN:"EOF");return 3}get_token();if(TOKEN!=":"){report(":",TOKEN?TOKEN:"EOF");return 4}get_token();if(parse_value(a1,key)){return 5}obj=obj key ":" VALUE;get_token();if(TOKEN=="}"){break}else if(TOKEN==","){obj=obj ","}else{report(",or }",TOKEN?TOKEN:"EOF");return 6}get_token()}}if(1!=BRIEF){VALUE=sprintf("{%s}",obj)}else{VALUE=""}return 0}function parse_value(a1,a2,jpath,ret,x){jpath=(a1!=""?a1 ",":"") a2;if(TOKEN=="{"){if(parse_object(jpath)){return 7}}else if(TOKEN=="["){if(ret=parse_array(jpath)){return ret}}else if(TOKEN~/^(|[^0-9])$/){report("value",TOKEN!=""?TOKEN:"EOF");return 9}else{VALUE=TOKEN}if(!(1==BRIEF&&(""==jpath||""==VALUE))){x=sprintf("[%s]\t%s",jpath,VALUE);if(0==STREAM){JPATHS[++NJPATHS]=x}else{print x}}return 0}function parse(ret){get_token();if(ret=parse_value()){return ret}if(get_token()){report("EOF",TOKEN);return 11}return 0}function report(expected,got,i,from,to,context){from=ITOKENS-10;if(from<1)from=1;to=ITOKENS+10;if(to>NTOKENS)to=NTOKENS;for(i=from;i<ITOKENS;i++)context=context sprintf("%s ",TOKENS[i]);context=context "<<" got ">> ";for(i=ITOKENS+1;i<=to;i++)context=context sprintf("%s ",TOKENS[i])}function reset(){TOKEN="";delete TOKENS;NTOKENS=ITOKENS=0;delete JPATHS;NJPATHS=0;VALUE=""}function tokenize(a1,pq,pb,ESCAPE,CHAR,STRING,NUMBER,KEYWORD,SPACE){SPACE="[[:space:]]+";gsub(/\"[^[:cntrl:]\"\\]*((\\[^u[:cntrl:]]|\\u[0-9a-fA-F]{4})[^[:cntrl:]\"\\]*)*\"|-?(0|[1-9][0-9]*)([.][0-9]*)?([eE][+-]?[0-9]*)?|null|false|true|[[:space:]]+|./,"\n&",a1);gsub("\n" SPACE,"\n",a1);sub(/^\n/,"",a1);ITOKENS=0;return NTOKENS=split(a1,TOKENS,/\n/)}'

# Guard to avoid running hooks when rebasing, just exit with success immediately
_branch_name=$(git branch | grep '*' | sed 's/* //')
if [[ "$_branch_name" == "(no branch)" ]]; then
    exit 0
fi

_find_script ()
{
    _json=$1
    _name=$2
    _script=""

    _ifs="${IFS}"
    IFS=$'\n'
    for line in $_json; do
        IFS="${_ifs}"
        echo "$line" | grep '\["scripts"' 2>&1 >/dev/null
        if [[ $? == 0 ]]; then
            match=$(echo $line | sed -n 's/\["scripts","\([^"]*\)"\] "\([^"]*\)"/\1 \2/p')
            IFS=' ' read -r name string <<< $match
            if [[ "$name" == "$_name" ]]; then
                _script=${match:${#name}+1}
                break
            fi
        fi
        IFS=$'\n'
    done
    IFS="${_ifs}"
    echo "$_script"
}

# Accepts parsed package.json and a script name as arguments, then finds the given
# script name and runs it
_run_script ()
{
    _defaults=$1
    _json=$2
    _name=$3

    echo -n "running $_name..."
    _script=$(_find_script "$_json" "$_name")
    if [[ "$_script" == "" ]]; then
        if [[ "$_defaults" != "" ]]; then
            _script=$(_find_script "$_defaults" "$_name")
        fi
    fi
    if [[ "$_script" == "" ]]; then
        echo "not found!" # this will return 0, which is fine
    else
        # out=$(mktemp -t "$_name")
        out=$(PATH=$PATH:./node_modules/.bin $_script 2>&1)
        res=$?
        if [[ $res != 0 ]]; then
            echo "failed!"
            echo "$out"
        else
            echo "passed!"
        fi
        return $res
    fi
}

_find_commands ()
{
    _json=$1
    _commands=""

    _ifs="${IFS}"
    IFS=$'\n'
    for line in $_json; do
        IFS="${_ifs}"
        echo "$line" | grep "\[\"$_cmd\"" 2>&1 >/dev/null
        if [[ $? == 0 ]]; then
            match=$(echo $line | sed -n "s/\[\"$_cmd\",[0-9]*\] \"\([^\"]*\)\"/\1/p")
            _commands="$_commands $match"
        fi
        IFS=$'\n'
    done
    IFS="${_ifs}"

    echo "$_commands"
}

# Accepts the full path to a project, parses the package.json and runs the relevant
# commands for the given project
_check_project ()
{
    _package=$1
    _dir=$(dirname $_package)
    _json=$(echo "$_package" | awk "$_json_parser")
    _defaults=""
    if [[ -f "$_dir/.validate.json" ]]; then
        _defaults=$(echo "$_dir/.validate.json" | awk "$_json_parser")
    fi

    _commands=$(_find_commands "$_json")
    if [[ "$_commands" == "" ]]; then
        _commands=$(_find_commands "$_defaults")
    fi

    if [[ "$_commands" == "" ]]; then
        echo "no checks for $_cmd found.. skipping"
        return 0
    fi

    pushd "$_dir" >/dev/null
    for cmd in $_commands; do
        _run_script "$_defaults" "$_json" "$cmd"
        res=$?
        [[ $res != 0 ]] && break
    done
    popd >/dev/null

    return $res
}

# Save the command name since it's the key we'll use to look up scripts
_cmd=$(basename $0)

# Find the root of the git repo the current directory is part of
_git_root=$(git rev-parse --show-toplevel)

# Change to the git repo's root and find all instances of package.json that
# are *not* inside a node_modules directory
pushd $_git_root >/dev/null
_projects=$(find . -name package.json -print | grep -v node_modules | sed s/\.//)
popd >/dev/null

# Iterate over each project
for project in $_projects; do
    _check_project $_git_root$project
    res=$?
    [[ $res != 0 ]] && exit $res
done

exit 0
