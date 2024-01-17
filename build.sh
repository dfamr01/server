
# Start the SSH agent and add the private key
eval $(ssh-agent -s)
echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -

# Setup GitHub as known host
mkdir -p ~/.ssh
ssh-keyscan github.com >> ~/.ssh/known_hosts

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