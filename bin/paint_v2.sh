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
tmp3=`mktemp -p ./public/edits/tmp --suffix=.jpg tmp.XXXXX`

convert -modulate 105,175,105 \
        -contrast \
        -colorize 0,3,3 \
        -level 1.5%,99%,0.9 \
        -noise 2 \
        -paint 1 \
        -quality 75 \
        $1 \
        $tmp1

convert $tmp1 \
        +repage \
        -selective-blur 0x5+10% \
        $tmp2

convert $tmp2 \
        -level 0x80% \
        -colorspace gray \
        -posterize 6 \
        -gamma 2.2 \
        $tmp3

convert $tmp2 \
        \( $tmp3 \
           -blur 0x1 \) \
        \( -clone 0 \
           -clone 1 \
           -compose over \
           -compose multiply \
           -composite \
           -modulate 100,150,100 \) \
        \( -clone 0 \
           -colorspace gray \) \
        \( -clone 3 \
           -negate \
           -blur 0x2 \) \
        \( -clone 3 \
           -clone 4 \
           -compose over \
           -compose colordodge \
           -composite \
           -evaluate pow 4 \
           -threshold 90% \
           -statistic median 3x3 \) \
        -delete 0,1,3,4 \
        -compose over \
        -compose multiply \
        -composite \
        $2

echo "finished paint_v2 edit"
