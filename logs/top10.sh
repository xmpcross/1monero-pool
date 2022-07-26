#!/bin/bash

POOL_LOG='pool_info.log';
DIFF=$(tac $POOL_LOG | grep -a -P "New .* block to mine" | head -n1 | awk '{print $16}' );

if [[ -n "$1" ]]; then
    DATE_FILTER="^$1.*"
else
    DATE_FILTER=""
fi

echo -e "Accepted:"
grep -a -P "${DATE_FILTER}Accepted" $POOL_LOG | wc -l | awk '{printf("%\047d\n", $0)}';

echo -e "\nDiff:"
echo $DIFF | awk '{printf("%\047d\n", $0)}'

echo -e "\nBlocks found:"
grep -a -A1 -P "${DATE_FILTER}found" $POOL_LOG | tail -n 14;

echo -e "\nTop shares"
grep -a -P "${DATE_FILTER}Accepted" $POOL_LOG \
    | awk '{print $10, $1, $2}' \
    | sed "s#/# #" | sort -n -k2 | tail -n10 \
    | awk '{printf("%s %-12s %-5s %\047-18d %-5s %\047-11d %-5s %.2f% \n", $3, $4, "|", $2, "|", $1, "|", $2*100/'$DIFF');}'

echo -e "\nAverage of shares:"
grep -a -P "${DATE_FILTER}Accepted" $POOL_LOG \
    | awk '{print $10}' \
    | sed 's#.*/##' \
    | awk '{ sum += $1; } END { printf("%\047d\n", sum / NR); }'
