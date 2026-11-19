" Built-in defaults for the Vim keys. Don't edit this file: the installer
" replaces it. Put your own bindings and settings in chrome/vimrc (open it
" with :config); it is read after this file, so it can override or unbind
" anything here.
"
" Syntax and key names are described at the top of chrome/vimrc.

set hintchars asdfghjkl     " letters used for link hints
set scrollstep 70           " pixels per j/k
set smoothscroll true
set timeout 1500            " ms to wait for the rest of a sequence

" --- scrolling -------------------------------------------------------------
bind j scrolldown
bind k scrollup
bind h scrollleft
bind l scrollright
bind <C-d> halfpagedown
bind <C-u> halfpageup
bind <C-f> pagedown
bind <C-b> pageup
bind gg scrolltop
bind G scrollbottom

" --- history and reloading -------------------------------------------------
bind H back
bind L forward
bind r reload
bind R reloadhard
bind gu urlup
bind gU urlroot

" --- tabs (J/K follow the vertical tab list: J down, K up) -----------------
bind J tabnext
bind K tabprev
bind gt tabnext
bind gT tabprev
bind g0 tabfirst
bind g$ tablast
bind d tabclose
bind u tabundo
bind t cmdline tabopen      " type an address or search, Enter opens it in a new tab
bind yt tabduplicate
bind gp tabpin
bind gb togglesidebar

" --- opening and copying ---------------------------------------------------
bind o open                 " address bar, ready to type
bind O opencurrent          " address bar with the current address to edit
bind p clipboardopen        " open the copied address/search here
bind P clipboardtabopen     " …in a new tab
bind yy yankurl

" --- hints and inputs ------------------------------------------------------
bind f hint                 " label links/buttons; type a label to click it
bind F hinttab              " …open the link in a background tab
bind gi focusinput          " jump into the first text field

" --- find and zoom ---------------------------------------------------------
bind / find
bind n findnext
bind N findprev
bind zi zoomin
bind zo zoomout
bind zz zoomreset

" --- modes and help --------------------------------------------------------
bind <S-Insert> toggleignore
bind ? help                 " list of keys, commands and where the config is
bind : cmdline              " command line: :open, :tabopen, :config, :set, …
