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
	gnome-terminal --geometry=90x20 \
		--tab-with-profile=default -t server 	--working-directory="$server" -e "bash -ci 'clear && yarn start'" \
		--tab-with-profile=default -t client 	--working-directory="$client" -e "bash -ci 'clear && rm -rf node_modules && yarn install && yarn start'" 
}

if [ ! -d "$src" ]; then
    printf "\nDirectory "$src" not found, check your path\n\n"
else
	cd $src

	merge_main
	sleep 2

	start
fi