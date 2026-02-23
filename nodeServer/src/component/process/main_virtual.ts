//这个文件是最核心的文件，负责维护main-virtual
let context_main_prompt = ""
let context_character_reference = ""
let context_events = ""
let context_workspace = ""
let context_object_network = ""
let context_pulled_info = ""
let context_step_progress = ""
//以上变量都是核心的内容，但是本文件只是维护main-virtual的文件，故以上的变量不是持久化的，而是每次使用重新从core_data载入的
