@echo off
echo Pushing to GitHub...
git add --all -- . ":!.data" ":!src/data/portal-data.json"
git commit -m "Update %date% %time%"
git push origin master
echo Done!
pause
