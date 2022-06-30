export var jsrad = jsrad ? jsrad : {}
jsrad.format = {}
jsrad.format.NBSP = "&nbsp"
jsrad.format.D = ","
jsrad.format.T = "."
jsrad.format.YYMIN = 50
jsrad.format.macro = {
	money: {integer:5,decimal:2,signed:true,thousand:true,size:10},
	perc: {integer:3,decimal:2,signed:true,thousand:false,size:7},
	date: {date:true,size:10},
	period: {period:true,size:7},
	timestamp: {timestamp:true,size:18},
	string: {string:true,size:0},
	"C999.99999.999999": {string:true,size:16,schema:"999.99999.999999"}
}

jsrad.format._mkthousand = function ( input ) {
	let num = input.split(this.D)
	let src = num[0].split("")
	let edit = ""
	for ( let pos = 0 ; pos < src.length ; pos++ ) {
		let idx = src.length - pos - 1
		edit = src[idx] + edit
		if ( idx && pos && !( ( pos + 1 ) % 3 ) ) {
			edit = this.T + edit
		}
	}
	if ( num.length > 1 ) { edit += this.D + num[1] }
	return edit
}

jsrad.format._toInt = function ( input ) {
	if ( typeof(input) == "string" ) {
		return parseInt(input)
	}
	return input
}

jsrad.format._computePeriod = function ( input ) {
	let tempd = input.split("/")
	let yy = ""
	let mm = ""
	if ( tempd.length == 2 ) {
		yy = this._mkyear(parseInt(tempd[0]))
		mm = parseInt(tempd[1])
	} else {
		yy = input.substr(0,4)
		mm = input.substr(4,2)
	}
	input = "01" + "/" + mm + "/" + yy
	let back = this._computeDate(input)
	return back
}

jsrad.format._computeDate = function ( input ) {
	input += " 000000"
	let back = this._computeTimestamp(input)
	return back
}

jsrad.format._computeTimestamp = function ( input ) {
	let tt = input.split(" ")
	let tempd = tt[0].split("/")
	let tempt = tt[1].split(":")
	if ( tempd.length == 3 ) {
		let yy = this._mkyear(parseInt(tempd[2]))
		let mm = parseInt(tempd[1])
		let dd = parseInt(tempd[0])
		input = ( dd * 1000000 + mm * 10000 + yy ).toString()
	} else {
		input = tt[0]
	}
	if ( tempt.length == 3 ) {
		input += tempt[0]
		input += tempt[1]
		input += tempt[2]
	} else {
		input += tt[1]
	}

	let temp = parseInt(input)
	let div = 100
	let ss = temp % div
	temp = ( temp / div ).toFixed(0)
	let mn = temp % div
	temp = ( temp / div ).toFixed(0)
	let hh = temp % div
	temp = ( temp / div ).toFixed(0)
	div = 10000
        if ( temp < 1000000 ) { div = 100 }
	let yy = temp % div
	temp = ( temp / div ).toFixed(0)
	let mm = temp % 100
	temp = ( temp / 100 ).toFixed(0)
	let dd = temp
	let date = this._mkts(yy,mm,dd,hh,mn,ss)
	return date
}

jsrad.format._mkyear = function ( yy ) {
	if ( typeof(yy) != "number" ) {
		throw "Bad year type"
	}
	if ( yy < 100 && yy < this.YYMIN ) {
		yy += 2000
	} else if ( yy < 100 && yy >= this.YYMIN ) {
		yy += 1900
	}
	return yy
}

jsrad.format._mkts = function ( yy, mm, dd, thh, tmm, tss ) {
	yy = this._mkyear(this._toInt(yy))
	mm = this._toInt(mm)
	dd = this._toInt(dd)
	thh = this._toInt(thh)
	tmm = this._toInt(tmm)
	tss = this._toInt(tss)
	let dtobj = new Date(yy,mm-1,dd,thh,tmm,tss)
	// console.log("DIR", dtobj.toString())
	let nyy = dtobj.getFullYear()
	let nmm = dtobj.getMonth()
	let ndd = dtobj.getDate()
	let nthh = dtobj.getHours()
	let ntmm = dtobj.getMinutes()
	let ntss = dtobj.getSeconds()
	if ( yy != nyy || mm-1 != nmm || dd != ndd ) { return null }
	if ( thh != nthh || tmm != ntmm || tss != ntss ) { return null }
	return dtobj
}
jsrad.format.replaceAll = function (string, search, replace) {
  return string.split(search).join(replace);
}
jsrad.format.createFormat = function ( picture ) {

	if ( !picture.includes("Z") && !picture.includes("-") && !picture.includes("9")) {
		throw "Bad format " + picture
	}
	let format = {}
	format["size"] = picture.length
	if ( !picture.includes("/") ) {
		if ( picture.includes(this.T) ) {
			format["thousand"] = true
		}
		picture = this.replaceAll(picture,this.T,"")
		if ( picture.includes("-") ) {
			format["signed"] = true
		}
		if ( picture.includes(this.D) ) {
			let tt = picture.split(this.D)
			format["integer"] = tt[0].length
			format["decimal"] = tt[1].length
		} else {
			format["integer"] = picture.length
		}
	} else {
			format["period"] = true
	}
	return format
}
jsrad.format.normalizeFormat = function ( format ) {
	let std = {
		string: false,
		date: false,
		period: false,
		timestamp: false,
		integer: 0,
		decimal: 0,
		signed: false,
		thousand: false,
		size: 0
	}
	for ( let key in format ) {
		if ( typeof(std[key]) == "undefined" ) {
			throw "Bad format " + key
		}
		std[key] = format[key]
	}
	return std
}

jsrad.format.formatSize = function ( format ) {
	return format.size
}

jsrad.format.screen2db = function ( string, format ) {
	// console.log("SCREEN2DB", typeof(string), string, format)
	let input = string
	input = input.trim()
	if ( input == "" ) { return input }
	let output = input
	if ( format.period ) {
		let date = this._computePeriod(output)
		output = ""
		if ( date != null ) {
			output = date.getFullYear() * 100
			output += ( date.getMonth() + 1 )
			output = output.toString()
		}
	} else if ( format.date ) {
		let date = this._computeDate(output)
		output = ""
		if ( date != null ) {
			output = date.getFullYear() * 10000
			output += ( date.getMonth() + 1 ) * 100
			output += date.getDate()
			output = output.toString()
		}
	} else if ( format.timestamp ) {
		let date = this._computeTimestamp(output)
		output = ""
		if ( date != null ) {
			output = date.getFullYear() * 10000000000
			output += ( date.getMonth() + 1 ) * 100000000
			output += date.getDate() * 1000000
			output += date.getHours() * 10000
			output += date.getMinutes() * 100
			output += date.getSeconds()
			output = output.toString()
		}
	} else if ( format.integer > 0 ) {
		output = this.replaceAll(output,this.T,"")
		output = output.replace(this.D, this.T)
		let val = parseFloat(output).toFixed(format.decimal)
		if ( !val.isNaN ) {
			val = val % ( 10 ** format.integer)
			val = parseFloat(val).toFixed(format.decimal)
			output = val.toString()
		} else {
			output = ""
		}
	} else if ( format.schema ) {
		let map = format.schema.split(".")
		let mval = input.split(".")
		for (let i = 0; i < mval.length; i++) {
			if ( i >= map.length ) { break }
			if ( isNaN(mval[i]) ) { break }
			mval[i] = mval[i].padStart(map[i].length,"0")
		}
		output = mval.join(".")
	}
	return output
}

jsrad.format.db2screen = function ( value, format ) {
	// console.log("DB2SCREEN", typeof(value), value, format)
	if ( value == "" ) { return value }
	let output
	if ( format.period ) {
		let yy = value.substr(0,4)
		let mm = value.substr(4,2)
		output = yy + "/" + mm
	} else if ( format.date ) {
		let yy = value.substr(0,4)
		let mm = value.substr(4,2)
		let dd = value.substr(6,2)
		output = dd + "/" + mm + "/" + yy
	} else if ( format.timestamp ) {
		let yy = value.substr(0,4)
		let mm = value.substr(4,2)
		let dd = value.substr(6,2)
		output = dd + "/" + mm + "/" + yy
		let h = value.substr(8,2)
		let m = value.substr(10,2)
		let s = value.substr(12,2)
		output += " " + h + ":" + m + ":" + s
	} else if ( format.integer > 0 ) {
		output = parseFloat(value).toFixed(format.decimal)
		output = output.replace(".", this.D)
		if ( format.thousand ) {
			if ( format.signed ) {
				let signelist = ["+", "-"];
				let signe = output.charAt(0);
				if ( signelist.indexOf(signe) > -1 ) {
					output = output.substr(1)
				}
				output = this._mkthousand(output)
				if ( signelist.indexOf(signe) > -1 ) {
					output = signe + output
				}
			} else {
				output = this._mkthousand(output)
			}
		}
	} else if ( format.schema ) {
		let map = format.schema.split(".")
		let mval = value.split(".")
		for (let i = 0; i < mval.length; i++) {
			if ( i >= map.length ) { break }
			if ( isNaN(mval[i]) ) { break }
			mval[i] = mval[i].padStart(map[i].length,"0")
		}
		output = mval.join(".")
	} else if ( format.string ) {
		output = value
	} else {
		throw "Unknown format"
	}
	return output
}
