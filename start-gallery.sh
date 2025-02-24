#!/bin/bash

src="$HOME/www/gallery"
server="$src/server"
client="$src/client"

merge_main() {
	current_branch=$(git branch --show-current)
	git stash && git switch main && git pull && git switch $current_branch

	printf "\nMerging main into actual branch '$current_branch'\n\n"
	git merge main
	printf "\nMerged main into '$current_branch' successfully\n\n"

	git stash pop
}

start() {
	if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux: Use gnome-terminal
        gnome-terminal --geometry=90x20 \
            --tab-with-profile=default -t server --working-directory="$server" -e "bash -ci 'clear && yarn start'" \
            --tab-with-profile=default -t client --working-directory="$client" -e "bash -ci 'clear && yarn install && yarn start'" 
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows (MSYS2/MINGW64): Use mintty
        mintty -t "Server" -e bash -ci "cd '$server' && clear && yarn start; exec bash" &
        mintty -t "Client" -e bash -ci "cd '$client' && clear && yarn install && yarn start; exec bash" &
    else
        echo "Unsupported OS: $OSTYPE"
    fi
}

if [ ! -d "$src" ]; then
    printf "\nDirectory "$src" not found, check your path\n\n"
else
	cd $src

    merge_main
	sleep 2
	start
fi