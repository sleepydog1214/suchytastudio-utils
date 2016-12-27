#!/bin/bash

# The MIT License (MIT)

# Copyright (c) 2016 Thomas Suchyta

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

tmp1=`mktemp -p ./public/edits/tmp --suffix=.jpg tmp.XXXXX`
tmp2=`mktemp -p ./public/edits/tmp --suffix=.jpg tmp.XXXXX`

size=`identify $1 | gawk -F' ' '{print $3}' -`

convert -modulate 105,175,105 \
        -contrast \
        -colorize 0,3,3 \
        -level 1.5%,99%,0.9 \
        -noise 2 \
        -paint 1 \
        -quality 75 \
        $1 \
        $tmp1

convert -size $size \
        xc:  +noise Random \
        -virtual-pixel tile \
        -motion-blur 0x40+135 \
        -charcoal 1 \
        -resize 50% \
        $tmp2

convert $tmp1 \
        -colorspace gray \
        \( +clone \
           -tile $tmp2 \
           -draw "color 0,0 reset" \
           +clone \
           +swap \
           -compose color_dodge \
           -composite \) \
         -fx "u*.2+v*.8" \
         -contrast-stretch 3% \
         -level 3%,90%,1.0 \
         $2

echo "finished draw_v2 edit"
