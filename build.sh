git submodule update --init --recursive --remote 
echo "finish submodule init"
filenames=('./server/shared/database/models/UploadMultiPart.model.js')

for filename in ${filenames[@]}; do
    if [ -f $filename ]; then
        echo "$filename exists."
    else
        echo "$filename does not exist."
    fi
done

npm install