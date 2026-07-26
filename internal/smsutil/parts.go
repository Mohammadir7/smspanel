package smsutil

import "unicode/utf8"

// Persian SMS part counting (simplified GSM/UCS rules for UX estimate).
func CountParts(text string) int {
	n := utf8.RuneCountInString(text)
	if n == 0 {
		return 0
	}
	single := 70
	multi := 67
	if n <= single {
		return 1
	}
	parts := n / multi
	if n%multi != 0 {
		parts++
	}
	return parts
}

func EstimateCostRial(recipients, partsPerMsg, pricePerPartRial int) int64 {
	if recipients <= 0 || partsPerMsg <= 0 {
		return 0
	}
	return int64(recipients) * int64(partsPerMsg) * int64(pricePerPartRial)
}
