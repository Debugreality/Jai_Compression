/**
* 
* Basic Huffman compression functions
* 
* This is the core compression routines used to compress data. 
* This is not a finished library so check out the example html for how to use these functions together.
* I'm encrypting into 7bit characters as most encoding schemes have valid 7bit characters however this may cause problems with some encoded strings...
* 
* Copyright (C) 2013 Jai Shaw. MIT licence below
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
* to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
* and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
* LIABILITY, WHETHER IN AN A ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
* DEALINGS IN THE SOFTWARE.
* 
* 
**/

var jaiNs = jaiNs || {};
jaiNs.compress = jaiNs.compress || {};

/**
* Function split the string into an array of characters with frequency
**/

jaiNs.compress.makeArray = function(dataInStr)
{
	if (!jaiNs.util.isString(dataInStr)) return [];
	var outArray = new Array();
	var found = false;
	var nextChar = dataInStr.charAt(0);
	while (dataInStr.length > 0)
	{
		for(var loop = 0;loop < outArray.length;loop++)
		{
			if(outArray[loop][0] == nextChar)
			{
				found = true;
				outArray[loop][1]++; 
			}
		}
		if (found == false) outArray.push([nextChar,1,'']);
		dataInStr = dataInStr.slice(1);
		found = false;
		nextChar = dataInStr.charAt(0);
	}
	outArray.sort(function(e1,e2){return(e2[1]-e1[1]);});
	return outArray;
};

/**
* Function change your array into a Huffman tree with binary encoding
**/

jaiNs.compress.makeTree = function(arrayIn)
{
	if(!jaiNs.util.isArray(arrayIn)) return [];
	if(arrayIn.length == 1) // this is an edge case where only one character is being encrypted...
	{
		arrayIn[0][2] = '1';
		return arrayIn;
	}
	while(arrayIn.length > 1)
	{
		var end1 = arrayIn.pop();
		var end2 = arrayIn.pop();
		var newTree = ['',end1[1]+end2[1], '', end1, end2];
		jaiNs.compress.addBinStr(newTree[3],'0');
		jaiNs.compress.addBinStr(newTree[4],'1');
		arrayIn.push(newTree);
		arrayIn.sort(function(e1,e2){return(e2[1]-e1[1]);});
	}
	return arrayIn;
};

/**
* Function extract your new encodeKey from your tree (recursive)
**/

jaiNs.compress.buildBinStrArray = function(treeIn, arrayInOut)
{
	if(!jaiNs.util.isArray(treeIn)) return;
	if(!jaiNs.util.isArray(arrayInOut)) return;
	
	if (treeIn.length > 3)
	{
		jaiNs.compress.buildBinStrArray(treeIn[3], arrayInOut);
		jaiNs.compress.buildBinStrArray(treeIn[4], arrayInOut);
	}
	else
	{
		var e = [treeIn[0],treeIn[1], treeIn[2]];
		arrayInOut.push(e);
	}
};

/**
* Function actually compress your data with your encode key (this key is created from the tree in example.html)
**/

jaiNs.compress.compress = function(compData, encodeKey)
{
	var rawCode = '';
	var retStr = '';
	for (var loop = 0;loop < compData.length;loop++)
	{
		var c = compData.charAt(loop);
		for (var loop2 = 0; loop2 < encodeKey.length;loop2++)
		{
			var e = encodeKey[loop2];
			if (c == e[0])
			{
				rawCode = rawCode + e[2];
				break;
			}
		}
		if (rawCode.length > 7)
		{
			var i = parseInt(rawCode.slice(0,7), 2);
			retStr = retStr + String.fromCharCode(i);
			rawCode = rawCode.slice(7);
		}
	}
	retStr = '' + (7 - rawCode.length) + retStr;
	if (rawCode.length > 0)
	{
		while (rawCode.length < 7){rawCode = rawCode + '0';}
		var i = parseInt(rawCode, 2);
		retStr = retStr + String.fromCharCode(i);
	}
	return retStr;
};

/**
* decrypt your data with your encode key
**/

jaiNs.compress.inflate = function(compData,encodeKey)
{
	var rawCode = '';
	var retStr = '';
	var endPadding = compData[0];
	var maxBitLen = (encodeKey[encodeKey.length-1])[2].length;
	var minBitLen = (encodeKey[0])[2].length;
	for (var loop = 1;loop < compData.length;loop++)
	{
		var i = compData.charCodeAt(loop);
		var binStr = i.toString(2);
		while (binStr.length < 7){binStr = '0' + binStr;}
		if (loop == compData.length-1)
		{
			binStr = binStr.substring(0,7-endPadding);
		}
		rawCode = rawCode + binStr;
		// pad with extra 0s to make sure we get the last char
		while (rawCode.length >= maxBitLen)
		{
			for (var loop2 = 0; loop2 < encodeKey.length;loop2++)
			{
				var e = encodeKey[loop2];
				var newChar = rawCode.slice(0,e[2].length);
				if (newChar == e[2])
				{
					retStr = retStr + e[0];
					rawCode = rawCode.slice(e[2].length);
					break;
				}
			}
		}
	}
	// add last charater(s) while rawCode.length > 0
	while (rawCode.length > 0)
	{
		for (var loop2 = 0; loop2 < encodeKey.length;loop2++)
		{
			var e = encodeKey[loop2];
			if (e[2].length <= rawCode.length)
			{
				var newChar = rawCode.slice(0,e[2].length);
				if (newChar == e[2])
				{
					retStr = retStr + e[0];
					rawCode = rawCode.slice(e[2].length);
					break;
				}
			}
		}
	}
	return retStr;
};

/* internal "private" function helps build tree */
jaiNs.compress.addBinStr = function(branchIn,bitIn)
{
	if (branchIn.length < 4)
	{
		branchIn[2] =  bitIn + branchIn[2];
		return;
	}
	jaiNs.compress.addBinStr(branchIn[3],bitIn);
	jaiNs.compress.addBinStr(branchIn[4],bitIn);
};
