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

thumb=${1/orig/thumbs}
ovly=${1/orig/ovly}
if [[ $1 = *.jpg ]]
then
  thumb=${thumb/.jpg/.jpg-thumb.jpg}
  ovly=${ovly/.jpg/.jpg-ovly.jpg}
elif [[ $1 = *.jpeg ]]
then
  thumb=${thumb/.jpeg/.jpeg-thumb.jpg}
  ovly=${ovly/.jpeg/.jpeg-ovly.jpg}
elif [[ $1 = *.png ]]
then
  thumb=${thumb/.png/.png-thumb.jpg}
  ovly=${ovly/.png/.png-ovly.jpg}
fi
convert -thumbnail x350 \
        $1 \
        $thumb

convert $1 \
        -resize x775 \
        $ovly

echo "finished thumb ovly: $thumb $ovly"
